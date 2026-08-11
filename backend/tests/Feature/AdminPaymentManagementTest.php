<?php

namespace Tests\Feature;

use App\Models\AdminAuditLog;
use App\Models\Order;
use App\Models\PaymentIntent;
use App\Models\PaymentWebhookEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminPaymentManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_search_filter_and_inspect_sanitized_payments(): void
    {
        [$admin, $buyer, $order, $intent] = $this->paymentFixture();
        $intent->transactions()->create([
            'provider' => 'mercado_pago',
            'external_id' => 'mp-payment-4455',
            'amount_cents' => 12500,
            'currency' => 'ARS',
            'status' => 'approved',
            'status_detail' => 'accredited',
            'payment_method_id' => 'visa',
            'payment_type_id' => 'credit_card',
            'live_mode' => false,
            'payload' => ['access_token' => 'must-not-leak'],
        ]);
        $intent->statusHistory()->create([
            'from_status' => 'pending',
            'to_status' => 'approved',
            'source' => 'webhook',
            'provider_payment_id' => 'mp-payment-4455',
            'metadata' => ['private' => 'must-not-leak'],
        ]);
        PaymentWebhookEvent::query()->create([
            'payment_intent_id' => $intent->id,
            'provider' => 'mercado_pago',
            'event_type' => 'payment',
            'external_id' => 'event-4455',
            'resource_id' => 'mp-payment-4455',
            'signature_valid' => true,
            'payload' => ['secret' => 'must-not-leak'],
            'status' => 'processed',
            'processed_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/admin/payments?status=approved&search='.urlencode($buyer->email))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reference', $intent->internal_reference)
            ->assertJsonPath('data.0.buyer.email', $buyer->email)
            ->assertJsonPath('data.0.orders.0.order_number', $order->order_number);

        $response = $this->getJson('/api/v1/admin/payments/'.$intent->id)
            ->assertOk()
            ->assertJsonPath('data.transactions.0.external_id', 'mp-payment-4455')
            ->assertJsonPath('data.webhook_events.0.external_id', 'event-4455')
            ->assertJsonPath('data.status_history.0.to_status', 'approved');

        $json = $response->getContent();
        $this->assertStringNotContainsString('must-not-leak', $json);
        $this->assertStringNotContainsString('access_token', $json);
    }

    public function test_admin_review_note_is_saved_and_audited(): void
    {
        [$admin, , , $intent] = $this->paymentFixture(['requires_review' => true, 'status' => 'requires_review']);
        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/admin/payments/'.$intent->id.'/review-notes', [
            'note' => 'Importe validado manualmente; falta revisar el medio de pago.',
        ])->assertCreated()
            ->assertJsonPath('data.admin.email', $admin->email);

        $this->assertDatabaseHas('payment_review_notes', [
            'payment_intent_id' => $intent->id,
            'admin_id' => $admin->id,
        ]);
        $this->assertDatabaseHas('admin_audit_logs', [
            'admin_id' => $admin->id,
            'action' => 'admin.payment.review_note_added',
            'subject_type' => PaymentIntent::class,
            'subject_id' => $intent->id,
        ]);
    }

    public function test_non_admin_cannot_access_payment_management(): void
    {
        [, $buyer, , $intent] = $this->paymentFixture();
        Sanctum::actingAs($buyer);

        $this->getJson('/api/v1/admin/payments')->assertForbidden();
        $this->getJson('/api/v1/admin/payments/'.$intent->id)->assertForbidden();
    }

    /** @return array{User, User, Order, PaymentIntent} */
    private function paymentFixture(array $intentOverrides = []): array
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $buyer = User::factory()->create(['role' => 'buyer', 'status' => 'active']);
        $order = Order::query()->create([
            'buyer_id' => $buyer->id,
            'order_number' => 'MA-TEST-4455',
            'status' => 'confirmed',
            'payment_status' => 'approved',
            'delivery_type' => 'producer_pickup',
            'subtotal_cents' => 12500,
            'delivery_cents' => 0,
            'total_cents' => 12500,
        ]);
        $intent = PaymentIntent::query()->create(array_merge([
            'order_id' => $order->id,
            'buyer_id' => $buyer->id,
            'internal_reference' => (string) Str::uuid(),
            'idempotency_key' => (string) Str::uuid(),
            'provider' => 'mercado_pago',
            'mode' => 'sandbox',
            'amount_cents' => 12500,
            'currency' => 'ARS',
            'status' => 'approved',
            'preference_id' => 'pref-4455',
            'provider_payment_id' => 'mp-payment-4455',
            'provider_status' => 'approved',
            'paid_at' => now(),
            'last_synced_at' => now(),
        ], $intentOverrides));
        $intent->orders()->attach($order->id);

        return [$admin, $buyer, $order, $intent];
    }
}
