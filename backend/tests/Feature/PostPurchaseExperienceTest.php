<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Order;
use App\Models\ProducerProfile;
use App\Models\Product;
use App\Models\User;
use App\Notifications\MarketplaceInAppNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostPurchaseExperienceTest extends TestCase
{
    use RefreshDatabase;

    public function test_buyer_creates_and_reuses_the_order_conversation_and_other_buyer_is_forbidden(): void
    {
        $this->seed();

        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();
        $otherBuyer = User::factory()->create(['role' => 'buyer', 'status' => 'active']);
        $product = Product::query()->where('status', 'active')->firstOrFail();

        $orderId = $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/checkout/buy-now', [
                'product_id' => $product->id,
                'quantity' => 1,
                'delivery_type' => 'local',
            ])
            ->assertCreated()
            ->json('data.id');

        $first = $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/v1/orders/{$orderId}/conversation")
            ->assertCreated()
            ->assertJsonPath('data.order_id', $orderId);

        $conversationId = $first->json('data.id');

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/v1/orders/{$orderId}/conversation")
            ->assertOk()
            ->assertJsonPath('data.id', $conversationId);

        $this->actingAs($otherBuyer, 'sanctum')
            ->postJson("/api/v1/orders/{$orderId}/conversation")
            ->assertForbidden();

        $this->assertSame(1, Conversation::query()->where('order_id', $orderId)->count());
        $this->assertSame(1, Conversation::query()->findOrFail($conversationId)->messages()->count());
    }

    public function test_notification_summary_read_and_read_all_are_scoped_to_the_authenticated_user(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer', 'status' => 'active']);
        $otherBuyer = User::factory()->create(['role' => 'buyer', 'status' => 'active']);

        $buyer->notifyNow(new MarketplaceInAppNotification(
            'order_confirmed',
            'Tu compra fue confirmada',
            'El pago fue aprobado.',
            '/orders?order=42',
            ['order_id' => 42],
        ));
        $otherBuyer->notifyNow(new MarketplaceInAppNotification(
            'order_confirmed',
            'Notificación ajena',
            'No debe ser visible.',
            '/orders?order=99',
            ['order_id' => 99],
        ));

        $summary = $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/v1/notifications/summary?limit=4')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 1)
            ->assertJsonPath('data.notifications.0.data.title', 'Tu compra fue confirmada')
            ->assertJsonPath('data.notifications.0.data.url', '/orders?order=42')
            ->assertJsonMissing(['title' => 'Notificación ajena']);

        $notificationId = $summary->json('data.notifications.0.id');

        $this->actingAs($buyer, 'sanctum')
            ->patchJson("/api/v1/notifications/{$notificationId}/read")
            ->assertOk();

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/v1/notifications/summary')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 0);

        $this->actingAs($buyer, 'sanctum')
            ->patchJson('/api/v1/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 0);
    }

    public function test_seller_can_accept_only_their_open_return_and_buyer_sees_the_history(): void
    {
        $this->seed();

        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();
        $product = Product::query()->with('producerProfile.user')->where('status', 'active')->firstOrFail();
        $seller = $product->producerProfile->user;
        $otherSeller = User::factory()->create(['role' => 'seller', 'status' => 'active']);
        ProducerProfile::query()->create([
            'user_id' => $otherSeller->id,
            'business_name' => 'Productor sin acceso a devolución',
            'slug' => 'productor-sin-acceso-devolucion',
            'status' => 'active',
        ]);

        $orderId = $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/checkout/buy-now', [
                'product_id' => $product->id,
                'quantity' => 1,
                'delivery_type' => 'local',
            ])
            ->assertCreated()
            ->json('data.id');

        Order::query()->findOrFail($orderId)->update(['status' => 'delivered']);

        $returnId = $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/v1/orders/{$orderId}/returns", [
                'reason' => 'El producto llegó dañado',
                'details' => 'Solicito revisar el embalaje.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'open')
            ->assertJsonPath('data.status_history.0.status', 'open')
            ->json('data.id');

        $this->actingAs($otherSeller, 'sanctum')
            ->patchJson("/api/v1/seller/returns/{$returnId}/status", ['status' => 'approved'])
            ->assertNotFound();

        $this->actingAs($seller, 'sanctum')
            ->patchJson("/api/v1/seller/returns/{$returnId}/status", [
                'status' => 'approved',
                'note' => 'Aceptamos la devolución.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->actingAs($seller, 'sanctum')
            ->patchJson("/api/v1/seller/returns/{$returnId}/status", ['status' => 'rejected'])
            ->assertUnprocessable();

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/v1/returns')
            ->assertOk()
            ->assertJsonFragment(['id' => $returnId, 'status' => 'approved'])
            ->assertJsonFragment(['status' => 'open'])
            ->assertJsonFragment(['status' => 'approved', 'note' => 'Aceptamos la devolución.']);

        $this->assertDatabaseHas('return_status_histories', [
            'return_request_id' => $returnId,
            'changed_by' => $buyer->id,
            'status' => 'open',
        ]);
        $this->assertDatabaseHas('return_status_histories', [
            'return_request_id' => $returnId,
            'changed_by' => $seller->id,
            'status' => 'approved',
        ]);
    }
}
