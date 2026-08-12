<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\PaymentIntent;
use App\Models\ProducerProfile;
use App\Models\Product;
use App\Models\StockReservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MercadoPagoCheckoutTest extends TestCase
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
        config()->set('services.mercado_pago.webhook_url', 'https://api.mercadoahora.test/api/v1/payments/webhooks/mercado-pago');

        Http::fake([
            'https://api.mercadopago.com/checkout/preferences' => Http::response([
                'id' => 'pref_test_123',
                'init_point' => 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_test_123',
                'sandbox_init_point' => 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_test_123',
                'collector_id' => 123456,
                'operation_type' => 'regular_payment',
            ], 201),
        ]);
    }

    public function test_checkout_creates_one_preference_multiple_orders_and_stock_reservations(): void
    {
        $buyer = $this->buyer();
        $firstProduct = $this->product('Miel', 5000, 10, 'La Colmena');
        $secondProduct = $this->product('Jabón natural', 190000, 4, 'Raíces Verdes');

        Sanctum::actingAs($buyer);
        $this->postJson('/api/v1/cart/items', ['product_id' => $firstProduct->id, 'quantity' => 2])->assertCreated();
        $this->postJson('/api/v1/cart/items', ['product_id' => $secondProduct->id, 'quantity' => 1])->assertCreated();

        $idempotencyKey = (string) Str::uuid();
        $response = $this->postJson('/api/v1/checkout/mercado-pago', [
            'idempotency_key' => $idempotencyKey,
            'delivery_type' => 'home_delivery',
            'delivery_address' => 'Calle 123',
            'city' => 'Córdoba',
            'province' => 'Córdoba',
        ])->assertCreated()
            ->assertJsonPath('data.orders_count', 2)
            ->assertJsonPath('data.checkout_url', 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_test_123')
            ->assertJsonPath('data.payment_intent.status', 'pending')
            ->assertJsonPath('data.payment_intent.provider', 'mercado_pago');

        $intentId = $response->json('data.payment_intent.id');
        $this->assertDatabaseHas('payment_intents', [
            'id' => $intentId,
            'buyer_id' => $buyer->id,
            'idempotency_key' => $idempotencyKey,
            'amount_cents' => 200000,
            'preference_id' => 'pref_test_123',
        ]);
        $this->assertDatabaseCount('payment_intent_order', 2);
        $this->assertDatabaseCount('stock_reservations', 2);
        $this->assertSame(3, StockReservation::query()->where('status', 'active')->sum('quantity'));
        $this->assertSame(10, $firstProduct->fresh()->stock);
        $this->assertSame(4, $secondProduct->fresh()->stock);
        $this->assertDatabaseMissing('cart_items', ['cart_id' => $buyer->cart->id]);

        Http::assertSent(function (ClientRequest $request): bool {
            $payload = $request->data();

            return $request->url() === 'https://api.mercadopago.com/checkout/preferences'
                && $request->hasHeader('Authorization', 'Bearer TEST_ACCESS_TOKEN')
                && count($payload['items']) === 2
                && collect($payload['items'])->sum(fn (array $item) => $item['quantity'] * $item['unit_price']) === 2000.0
                && $payload['external_reference'] !== '';
        });
    }

    public function test_same_idempotency_key_does_not_duplicate_orders_or_preference(): void
    {
        $buyer = $this->buyer();
        $product = $this->product('Miel', 5000, 3, 'La Colmena');
        Sanctum::actingAs($buyer);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertCreated();

        $payload = ['idempotency_key' => (string) Str::uuid()];
        $first = $this->postJson('/api/v1/checkout/mercado-pago', $payload)->assertCreated();
        $second = $this->postJson('/api/v1/checkout/mercado-pago', $payload)->assertCreated();

        $this->assertSame($first->json('data.payment_intent.id'), $second->json('data.payment_intent.id'));
        $this->assertDatabaseCount('payment_intents', 1);
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('stock_reservations', 1);
        Http::assertSentCount(1);
    }

    public function test_active_reservations_reduce_available_stock_for_another_buyer(): void
    {
        $product = $this->product('Última miel', 5000, 1, 'La Colmena');

        $firstBuyer = $this->buyer('first@example.com');
        Sanctum::actingAs($firstBuyer);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertCreated();
        $this->postJson('/api/v1/checkout/mercado-pago', ['idempotency_key' => (string) Str::uuid()])->assertCreated();

        $secondBuyer = $this->buyer('second@example.com');
        Sanctum::actingAs($secondBuyer);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertCreated();
        $this->postJson('/api/v1/checkout/mercado-pago', ['idempotency_key' => (string) Str::uuid()])
            ->assertStatus(422)
            ->assertJsonPath('conflicts.0.product_id', $product->id)
            ->assertJsonPath('conflicts.0.available_stock', 0)
            ->assertJsonPath('conflicts.0.requested_quantity', 1);
    }

    public function test_preference_uses_current_database_price_instead_of_cart_snapshot(): void
    {
        $buyer = $this->buyer();
        $product = $this->product('Miel', 5000, 5, 'La Colmena');
        Sanctum::actingAs($buyer);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertCreated();
        $product->update(['price_cents' => 7500]);

        $this->postJson('/api/v1/checkout/mercado-pago', ['idempotency_key' => (string) Str::uuid()])
            ->assertCreated()
            ->assertJsonPath('data.payment_intent.amount_cents', 7500);

        $this->assertDatabaseHas('order_items', ['product_id' => $product->id, 'unit_price_cents' => 7500]);
    }

    public function test_buy_now_creates_preference_order_and_reservation_without_using_cart(): void
    {
        $buyer = $this->buyer();
        $product = $this->product('Miel', 5000, 3, 'La Colmena');
        Sanctum::actingAs($buyer);

        $response = $this->postJson('/api/v1/checkout/mercado-pago', [
            'idempotency_key' => (string) Str::uuid(),
            'product_id' => $product->id,
            'quantity' => 2,
            'delivery_type' => 'home_delivery',
        ])->assertCreated()
            ->assertJsonPath('data.orders_count', 1)
            ->assertJsonPath('data.payment_intent.mode', 'sandbox')
            ->assertJsonPath('data.payment_intent.amount_cents', 10000)
            ->assertJsonPath('data.checkout_url', 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_test_123');

        $this->assertDatabaseHas('orders', [
            'id' => $response->json('data.orders.0.id'),
            'buyer_id' => $buyer->id,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);
        $this->assertDatabaseHas('stock_reservations', [
            'payment_intent_id' => $response->json('data.payment_intent.id'),
            'product_id' => $product->id,
            'quantity' => 2,
            'status' => 'active',
        ]);
        $this->assertSame(3, $product->fresh()->stock);
        $this->assertDatabaseCount('cart_items', 0);

        Http::assertSent(function (ClientRequest $request): bool {
            $payload = $request->data();

            return ! array_key_exists('payer', $payload)
                && $payload['items'][0]['quantity'] === 2;
        });
    }

    public function test_buy_now_is_idempotent_and_reports_reserved_stock_conflicts(): void
    {
        $buyer = $this->buyer();
        $product = $this->product('Miel', 5000, 2, 'La Colmena');
        Sanctum::actingAs($buyer);
        $payload = [
            'idempotency_key' => (string) Str::uuid(),
            'product_id' => $product->id,
            'quantity' => 2,
        ];

        $first = $this->postJson('/api/v1/checkout/mercado-pago', $payload)->assertCreated();
        $second = $this->postJson('/api/v1/checkout/mercado-pago', $payload)->assertCreated();
        $this->assertSame($first->json('data.payment_intent.id'), $second->json('data.payment_intent.id'));
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('payment_intents', 1);

        $this->postJson('/api/v1/checkout/mercado-pago', [
            'idempotency_key' => (string) Str::uuid(),
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertStatus(422)
            ->assertJsonPath('conflicts.0.product_id', $product->id)
            ->assertJsonPath('conflicts.0.available_stock', 0);
    }
    private function buyer(string $email = 'buyer@example.com'): User
    {
        return User::factory()->create(['email' => $email, 'role' => 'buyer', 'status' => 'active']);
    }

    private function product(string $name, int $priceCents, int $stock, string $business): Product
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

        return Product::query()->create([
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
    }
}
