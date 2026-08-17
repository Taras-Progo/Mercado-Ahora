<?php

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Jobs\ProcessMercadoPagoWebhook;
use App\Models\Category;
use App\Models\PaymentIntent;
use App\Models\PaymentWebhookEvent;
use App\Models\ProducerProfile;
use App\Models\Product;
use App\Models\StockReservation;
use App\Models\User;
use App\Notifications\PaidOrderReceivedNotification;
use App\Notifications\PaymentStatusNotification;
use App\Services\Payments\MercadoPagoPaymentProcessor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MercadoPagoLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.mercado_pago.access_token', 'TEST_ACCESS_TOKEN');
        config()->set('services.mercado_pago.mode', 'sandbox');
        config()->set('services.mercado_pago.api_url', 'https://api.mercadopago.com');
        config()->set('services.mercado_pago.reservation_minutes', 30);
        config()->set('services.mercado_pago.success_url', 'https://mercadoahora.test/checkout/pago/aprobado');
        config()->set('services.mercado_pago.pending_url', 'https://mercadoahora.test/checkout/pago/pendiente');
        config()->set('services.mercado_pago.failure_url', 'https://mercadoahora.test/checkout/pago/fallido');
        config()->set('services.mercado_pago.webhook_url', 'https://api.mercadoahora.test/api/v1/payments/webhooks/mercado_pago');
        config()->set('services.mercado_pago.webhook_secret', 'sandbox-webhook-secret');
        config()->set('services.mercado_pago.webhook_tolerance_seconds', 300);

        Http::fake([
            'https://api.mercadopago.com/checkout/preferences' => Http::response([
                'id' => 'pref_'.Str::lower(Str::random(10)),
                'init_point' => 'https://mercadopago.test/checkout',
                'sandbox_init_point' => 'https://sandbox.mercadopago.test/checkout',
            ], 201),
        ]);
    }

    public function test_signed_webhook_is_idempotent_and_invalid_signature_is_rejected(): void
    {
        Queue::fake();
        $dataId = '123456789';
        $requestId = 'request-test-1';
        $timestamp = (string) time();
        $manifest = "id:{$dataId};request-id:{$requestId};ts:{$timestamp};";
        $signature = 'ts='.$timestamp.',v1='.hash_hmac('sha256', $manifest, 'sandbox-webhook-secret');
        $url = '/api/v1/payments/webhooks/mercado_pago?data.id='.$dataId;
        $payload = ['id' => 'event-1', 'type' => 'payment', 'data' => ['id' => $dataId]];
        $headers = ['x-request-id' => $requestId, 'x-signature' => $signature];

        $this->postJson($url, $payload, ['x-request-id' => $requestId, 'x-signature' => 'ts='.$timestamp.',v1=invalid'])
            ->assertUnauthorized();
        $this->assertDatabaseCount('payment_webhook_events', 0);

        $this->postJson($url, $payload, $headers)->assertOk();
        $this->postJson($url, $payload, $headers)->assertOk()
            ->assertJsonPath('data.message', 'Webhook ya recibido.');

        $this->assertDatabaseCount('payment_webhook_events', 1);
        Queue::assertPushed(ProcessMercadoPagoWebhook::class, 1);
    }

    public function test_webhook_job_fetches_payment_from_provider_before_processing(): void
    {
        Notification::fake();
        [, , $intent, $products] = $this->checkoutWithTwoProducers();
        $payment = $this->providerPayment($intent, 'approved', 'payment-job-1');
        Http::fake([
            'https://api.mercadopago.com/v1/payments/payment-job-1' => Http::response($payment),
        ]);
        $event = PaymentWebhookEvent::query()->create([
            'provider' => 'mercado_pago',
            'event_type' => 'payment',
            'external_id' => 'event-job-1',
            'request_id' => 'request-job-1',
            'resource_id' => 'payment-job-1',
            'signature_valid' => true,
            'payload' => ['resource_id' => 'payment-job-1'],
            'status' => 'received',
        ]);

        (new ProcessMercadoPagoWebhook($event->id))->handle(
            app(PaymentGateway::class),
            app(MercadoPagoPaymentProcessor::class),
        );

        Http::assertSent(fn (ClientRequest $request) => $request->method() === 'GET'
            && str_contains($request->url(), '/v1/payments/payment-job-1'));
        $this->assertSame('processed', $event->fresh()->status);
        $this->assertSame('approved', $intent->fresh()->status);
        $this->assertSame(8, $products[0]->fresh()->stock);
        $this->assertSame(3, $products[1]->fresh()->stock);
    }

    public function test_simulated_webhook_with_fake_payment_is_ignored_without_retries(): void
    {
        Http::fake([
            'https://api.mercadopago.com/v1/payments/123456' => Http::response([], 404),
        ]);
        $event = PaymentWebhookEvent::query()->create([
            'provider' => 'mercado_pago',
            'event_type' => 'payment',
            'external_id' => 'simulated-event',
            'request_id' => 'simulated-request',
            'resource_id' => '123456',
            'signature_valid' => true,
            'payload' => ['resource_id' => '123456'],
            'status' => 'received',
        ]);

        (new ProcessMercadoPagoWebhook($event->id))->handle(
            app(PaymentGateway::class),
            app(MercadoPagoPaymentProcessor::class),
        );

        $this->assertSame('ignored', $event->fresh()->status);
        $this->assertSame(1, $event->fresh()->attempts);
        $this->assertNotNull($event->fresh()->processed_at);
    }

    public function test_buyer_status_poll_reconciles_sandbox_payment_without_webhook(): void
    {
        Notification::fake();
        [$buyer, , $intent, $products] = $this->checkoutWithTwoProducers();
        $payment = $this->providerPayment($intent, 'approved', 'payment-poll-1');
        Http::fake([
            'https://api.mercadopago.com/v1/payments/search*' => Http::response(['results' => [$payment]]),
        ]);

        Sanctum::actingAs($buyer);
        $this->getJson('/api/v1/payments/intents/'.$intent->internal_reference)
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.orders.0.payment_status', 'approved');

        $this->assertSame('approved', $intent->fresh()->status);
        $this->assertSame(8, $products[0]->fresh()->stock);
        $this->assertSame(3, $products[1]->fresh()->stock);
        Http::assertSent(fn (ClientRequest $request) => $request->method() === 'GET'
            && str_contains($request->url(), '/v1/payments/search')
            && str_contains($request->url(), rawurlencode($intent->internal_reference)));
    }

    public function test_scheduled_reconciliation_updates_pending_sandbox_payment(): void
    {
        Notification::fake();
        [, , $intent] = $this->checkoutWithTwoProducers();
        $payment = $this->providerPayment($intent, 'approved', 'payment-scheduled-1');
        Http::fake([
            'https://api.mercadopago.com/v1/payments/search*' => Http::response(['results' => [$payment]]),
        ]);

        $this->artisan('payments:sync-mercado-pago')->assertSuccessful();

        $this->assertSame('approved', $intent->fresh()->status);
    }

    public function test_expiration_command_processes_delayed_approval_before_releasing_stock(): void
    {
        Notification::fake();
        [, , $intent, $products] = $this->checkoutWithTwoProducers();
        $intent->update(['expires_at' => now()->subMinute()]);
        $payment = $this->providerPayment($intent, 'approved', 'payment-delayed-1');
        Http::fake([
            'https://api.mercadopago.com/v1/payments/search*' => Http::response(['results' => [$payment]]),
        ]);

        $this->artisan('payments:expire-reservations')->assertSuccessful();

        Http::assertSent(fn (ClientRequest $request) => $request->method() === 'GET'
            && str_contains($request->url(), '/v1/payments/search')
            && str_contains($request->url(), rawurlencode($intent->internal_reference)));
        $this->assertSame('approved', $intent->fresh()->status);
        $this->assertSame(8, $products[0]->fresh()->stock);
        $this->assertSame(3, $products[1]->fresh()->stock);
    }

    public function test_expiration_command_releases_reservation_only_after_provider_check(): void
    {
        Notification::fake();
        [, , $intent, $products] = $this->checkoutWithTwoProducers();
        $intent->update(['expires_at' => now()->subMinute()]);
        Http::fake([
            'https://api.mercadopago.com/v1/payments/search*' => Http::response(['results' => []]),
        ]);

        $this->artisan('payments:expire-reservations')->assertSuccessful();

        Http::assertSent(fn (ClientRequest $request) => $request->method() === 'GET'
            && str_contains($request->url(), '/v1/payments/search'));
        $this->assertSame('expired', $intent->fresh()->status);
        $this->assertSame(10, $products[0]->fresh()->stock);
        $this->assertSame(4, $products[1]->fresh()->stock);
        $this->assertSame(3, StockReservation::query()->where('status', 'released')->sum('quantity'));
    }
    public function test_approved_payment_consumes_stock_once_and_confirms_all_orders(): void
    {
        Notification::fake();
        [$buyer, $seller, $intent, $products] = $this->checkoutWithTwoProducers();
        $payment = $this->providerPayment($intent, 'approved', 'payment-approved-1');
        $processor = app(MercadoPagoPaymentProcessor::class);

        $processor->processProviderPayment($payment);

        $this->assertSame(8, $products[0]->fresh()->stock);
        $this->assertSame(3, $products[1]->fresh()->stock);
        $this->assertSame('approved', $intent->fresh()->status);
        $this->assertSame(3, StockReservation::query()->where('status', 'consumed')->sum('quantity'));
        $this->assertSame(2, $intent->orders()->where('orders.status', 'confirmed')->count());
        $this->assertSame(2, $intent->orders()->where('payment_status', 'approved')->count());
        $this->assertDatabaseHas('payment_transactions', ['external_id' => 'payment-approved-1', 'status' => 'approved']);
        $this->assertDatabaseHas('payment_status_histories', ['payment_intent_id' => $intent->id, 'to_status' => 'approved']);

        $processor->processProviderPayment($payment);
        $this->assertSame(8, $products[0]->fresh()->stock);
        $this->assertSame(3, $products[1]->fresh()->stock);
        $this->assertDatabaseCount('payment_transactions', 1);
        $this->assertDatabaseCount('payment_status_histories', 1);

        Notification::assertSentTo($buyer, PaymentStatusNotification::class, 1);
        Notification::assertSentTo($seller, PaidOrderReceivedNotification::class, 1);
    }

    public function test_rejection_releases_stock_and_cancels_orders(): void
    {
        [$buyer, , $intent, $products] = $this->checkoutWithTwoProducers();

        app(MercadoPagoPaymentProcessor::class)->processProviderPayment(
            $this->providerPayment($intent, 'rejected', 'payment-rejected-1'),
        );

        $this->assertSame(10, $products[0]->fresh()->stock);
        $this->assertSame(4, $products[1]->fresh()->stock);
        $this->assertSame('rejected', $intent->fresh()->status);
        $this->assertSame(3, StockReservation::query()->where('status', 'released')->sum('quantity'));
        $this->assertSame(2, $intent->orders()->where('orders.status', 'cancelled')->count());
        $this->assertSame(2, $intent->orders()->where('payment_status', 'rejected')->count());
    }

    public function test_mismatched_payment_is_flagged_for_review_without_changing_stock(): void
    {
        [, , $intent, $products] = $this->checkoutWithTwoProducers();
        $payment = $this->providerPayment($intent, 'approved', 'payment-mismatch-1');
        $payment['transaction_amount'] += 1;

        app(MercadoPagoPaymentProcessor::class)->processProviderPayment($payment);

        $this->assertSame('requires_review', $intent->fresh()->status);
        $this->assertTrue($intent->fresh()->requires_review);
        $this->assertSame(10, $products[0]->fresh()->stock);
        $this->assertSame(4, $products[1]->fresh()->stock);
        $this->assertSame(3, StockReservation::query()->where('status', 'active')->sum('quantity'));
    }

    public function test_sandbox_accepts_checkout_pro_test_buyer_when_provider_reports_live_mode(): void
    {
        [, , $intent, $products] = $this->checkoutWithTwoProducers();
        $payment = $this->providerPayment($intent, 'approved', 'payment-test-buyer-1');
        $payment['live_mode'] = true;
        $payment['payer'] = ['email' => 'test_user_123@testuser.com'];

        app(MercadoPagoPaymentProcessor::class)->processProviderPayment($payment);

        $this->assertSame('approved', $intent->fresh()->status);
        $this->assertFalse($intent->fresh()->requires_review);
        $this->assertSame(8, $products[0]->fresh()->stock);
        $this->assertSame(3, $products[1]->fresh()->stock);
    }

    public function test_sandbox_rejects_live_payment_without_mercado_pago_test_buyer(): void
    {
        [, , $intent, $products] = $this->checkoutWithTwoProducers();
        $payment = $this->providerPayment($intent, 'approved', 'payment-invalid-live-1');
        $payment['live_mode'] = true;
        $payment['payer'] = ['email' => 'buyer@example.com'];

        app(MercadoPagoPaymentProcessor::class)->processProviderPayment($payment);

        $this->assertSame('requires_review', $intent->fresh()->status);
        $this->assertSame(10, $products[0]->fresh()->stock);
        $this->assertSame(4, $products[1]->fresh()->stock);
    }

    public function test_sandbox_rejects_payment_from_another_collector(): void
    {
        [, , $intent, $products] = $this->checkoutWithTwoProducers();
        $intent->update(['preference_id' => '3594962572-preference-test']);
        $payment = $this->providerPayment($intent, 'approved', 'payment-wrong-collector-1');
        $payment['collector_id'] = 9999999999;

        app(MercadoPagoPaymentProcessor::class)->processProviderPayment($payment);

        $this->assertSame('requires_review', $intent->fresh()->status);
        $this->assertSame(10, $products[0]->fresh()->stock);
        $this->assertSame(4, $products[1]->fresh()->stock);
    }

    public function test_late_approval_after_release_consumes_stock_when_it_is_still_available(): void
    {
        [, , $intent, $products] = $this->checkoutWithTwoProducers();
        $processor = app(MercadoPagoPaymentProcessor::class);
        $processor->expire($intent);

        $processor->processProviderPayment($this->providerPayment($intent, 'approved', 'payment-late-1'));

        $this->assertSame('approved', $intent->fresh()->status);
        $this->assertSame(8, $products[0]->fresh()->stock);
        $this->assertSame(3, $products[1]->fresh()->stock);
        $this->assertSame(2, $intent->orders()->where('orders.status', 'confirmed')->count());
    }

    public function test_late_approval_after_release_requires_review_when_stock_is_no_longer_available(): void
    {
        [, , $intent, $products] = $this->checkoutWithTwoProducers();
        $processor = app(MercadoPagoPaymentProcessor::class);
        $processor->expire($intent);
        $products[0]->update(['stock' => 1]);

        $processor->processProviderPayment($this->providerPayment($intent, 'approved', 'payment-late-no-stock-1'));

        $this->assertSame('requires_review', $intent->fresh()->status);
        $this->assertSame(1, $products[0]->fresh()->stock);
        $this->assertSame(4, $products[1]->fresh()->stock);
    }

    public function test_buyer_can_read_status_and_retry_failed_intent_without_duplicate_orders(): void
    {
        [$buyer, , $intent] = $this->checkoutWithTwoProducers();
        app(MercadoPagoPaymentProcessor::class)->processProviderPayment(
            $this->providerPayment($intent, 'rejected', 'payment-retry-1'),
        );

        Sanctum::actingAs($buyer);
        $this->getJson('/api/v1/payments/intents/'.$intent->internal_reference)
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.retry_allowed', true)
            ->assertJsonCount(2, 'data.orders');

        $orderCount = $intent->orders()->count();
        $retryKey = (string) Str::uuid();
        $firstRetry = $this->postJson('/api/v1/payments/intents/'.$intent->internal_reference.'/retry', [
            'idempotency_key' => $retryKey,
        ])->assertCreated()
            ->assertJsonPath('data.payment_intent.status', 'pending');
        $secondRetry = $this->postJson('/api/v1/payments/intents/'.$intent->internal_reference.'/retry', [
            'idempotency_key' => $retryKey,
        ])->assertCreated();

        $this->assertSame($firstRetry->json('data.payment_intent.id'), $secondRetry->json('data.payment_intent.id'));
        $this->assertDatabaseCount('orders', $orderCount);
        $this->assertDatabaseCount('payment_intents', 2);
        $this->assertSame(3, StockReservation::query()->where('status', 'active')->sum('quantity'));
    }

    public function test_seller_cannot_fulfill_mercado_pago_order_before_approval(): void
    {
        [, $seller, $intent] = $this->checkoutWithTwoProducers();
        $order = $intent->orders()->whereHas('items', fn ($query) => $query->where('producer_profile_id', $seller->producerProfile->id))->firstOrFail();
        Sanctum::actingAs($seller);

        $this->patchJson('/api/v1/seller/orders/'.$order->id.'/status', ['status' => 'processing'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'El pago con Mercado Pago todavía no fue aprobado. No podés preparar ni enviar este pedido.');
    }

    /** @return array{User, User, PaymentIntent, array{Product, Product}} */
    private function checkoutWithTwoProducers(): array
    {
        $buyer = User::factory()->create(['email' => Str::random(8).'@buyer.test', 'role' => 'buyer', 'status' => 'active']);
        [$firstProduct, $firstSeller] = $this->product('Miel', 5000, 10, 'La Colmena');
        [$secondProduct] = $this->product('Jabón natural', 190000, 4, 'Raíces Verdes');
        Sanctum::actingAs($buyer);
        $this->postJson('/api/v1/cart/items', ['product_id' => $firstProduct->id, 'quantity' => 2])->assertCreated();
        $this->postJson('/api/v1/cart/items', ['product_id' => $secondProduct->id, 'quantity' => 1])->assertCreated();
        $response = $this->postJson('/api/v1/checkout/mercado-pago', ['idempotency_key' => (string) Str::uuid(), 'delivery_type' => 'local'])->assertCreated();

        return [$buyer, $firstSeller, PaymentIntent::query()->findOrFail($response->json('data.payment_intent.id')), [$firstProduct, $secondProduct]];
    }

    /** @return array{Product, User} */
    private function product(string $name, int $priceCents, int $stock, string $business): array
    {
        $seller = User::factory()->create(['role' => 'seller', 'status' => 'active']);
        $profile = ProducerProfile::query()->create([
            'user_id' => $seller->id,
            'business_name' => $business,
            'slug' => Str::slug($business).'-'.Str::lower(Str::random(5)),
            'province' => 'Córdoba',
            'city' => 'Alta Gracia',
            'status' => 'active',
        ]);
        $category = Category::query()->firstOrCreate(
            ['slug' => 'alimentos-naturales'],
            ['name' => 'Alimentos naturales', 'is_active' => true],
        );

        $product = Product::query()->create([
            'producer_profile_id' => $profile->id,
            'category_id' => $category->id,
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'description' => 'Producto de prueba',
            'price_cents' => $priceCents,
            'currency' => 'ARS',
            'stock' => $stock,
            'unit' => 'unidad',
            'province' => 'Córdoba',
            'city' => 'Alta Gracia',
            'status' => 'active',
        ]);

        return [$product, $seller->load('producerProfile')];
    }

    /** @return array<string, mixed> */
    private function providerPayment(PaymentIntent $intent, string $status, string $id): array
    {
        return [
            'id' => $id,
            'external_reference' => $intent->internal_reference,
            'status' => $status,
            'status_detail' => $status === 'approved' ? 'accredited' : 'cc_rejected_other_reason',
            'currency_id' => 'ARS',
            'transaction_amount' => $intent->amount_cents / 100,
            'live_mode' => false,
            'date_created' => now()->toIso8601String(),
            'date_approved' => $status === 'approved' ? now()->toIso8601String() : null,
            'payment_method_id' => 'master',
            'payment_type_id' => 'credit_card',
        ];
    }
}
