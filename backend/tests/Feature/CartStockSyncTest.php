<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ProducerProfile;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartStockSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_cart_quantity_equal_to_available_stock_is_allowed(): void
    {
        [$buyer, , $product] = $this->marketplaceProduct(stock: 1);

        Sanctum::actingAs($buyer);

        $this->postJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])
            ->assertCreated()
            ->assertJsonPath('data.items.0.quantity', 1)
            ->assertJsonPath('data.items.0.product.stock', 1);
    }

    public function test_cart_stock_conflict_uses_structured_spanish_payload(): void
    {
        [$buyer, , $product] = $this->marketplaceProduct(stock: 1);

        Sanctum::actingAs($buyer);

        $this->postJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Stock insuficiente. Solo quedan 1 disponibles.')
            ->assertJsonPath('conflicts.0.product_id', $product->id)
            ->assertJsonPath('conflicts.0.product_name', 'Miel')
            ->assertJsonPath('conflicts.0.requested_quantity', 2)
            ->assertJsonPath('conflicts.0.available_stock', 1)
            ->assertJsonPath('conflicts.0.status', 'active');
    }

    public function test_cart_refetch_and_update_use_latest_seller_stock(): void
    {
        [$buyer, $seller, $product] = $this->marketplaceProduct(stock: 1);

        Sanctum::actingAs($buyer);
        $cartResponse = $this->postJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertCreated();

        $itemId = $cartResponse->json('data.items.0.id');

        Sanctum::actingAs($seller);
        $this->patchJson("/api/v1/seller/products/{$product->id}", [
            'stock' => 12,
        ])->assertOk()->assertJsonPath('data.stock', 12);

        Sanctum::actingAs($buyer);
        $cartFetch = $this->getJson('/api/v1/cart')
            ->assertOk()
            ->assertJsonPath('data.items.0.product.stock', 12);

        $this->assertStringContainsString('no-store', $cartFetch->headers->get('Cache-Control'));

        $this->patchJson("/api/v1/cart/items/{$itemId}", [
            'quantity' => 12,
        ])
            ->assertOk()
            ->assertJsonPath('data.items.0.quantity', 12)
            ->assertJsonPath('data.items.0.product.stock', 12);

        $this->patchJson("/api/v1/cart/items/{$itemId}", [
            'quantity' => 13,
        ])
            ->assertStatus(422)
            ->assertJsonPath('conflicts.0.available_stock', 12)
            ->assertJsonPath('conflicts.0.requested_quantity', 13);
    }

    public function test_unauthenticated_cart_requests_are_spanish(): void
    {
        $this->patchJson('/api/v1/cart/items/1', [
            'quantity' => 1,
        ])
            ->assertStatus(401)
            ->assertJsonPath('message', 'No pudimos validar tu sesión. Iniciá sesión nuevamente.');
    }

    /**
     * @return array{0: User, 1: User, 2: Product}
     */
    private function marketplaceProduct(int $stock): array
    {
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'status' => 'active',
        ]);

        $seller = User::factory()->create([
            'role' => 'seller',
            'status' => 'active',
        ]);

        $profile = ProducerProfile::query()->create([
            'user_id' => $seller->id,
            'business_name' => 'La Colmena',
            'slug' => 'la-colmena',
            'province' => 'Córdoba',
            'city' => 'Alta Gracia',
            'status' => 'active',
        ]);

        $category = Category::query()->create([
            'name' => 'Alimentos naturales',
            'slug' => 'alimentos-naturales',
            'is_active' => true,
        ]);

        $product = Product::query()->create([
            'producer_profile_id' => $profile->id,
            'category_id' => $category->id,
            'name' => 'Miel',
            'slug' => 'miel',
            'description' => 'Miel natural',
            'price_cents' => 5000,
            'currency' => 'ARS',
            'stock' => $stock,
            'unit' => 'kg',
            'province' => 'Córdoba',
            'city' => 'Alta Gracia',
            'status' => 'active',
        ]);

        return [$buyer, $seller, $product];
    }
}
