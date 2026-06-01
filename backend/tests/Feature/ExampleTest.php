<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Category;
use App\Models\ProducerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_public_catalog_endpoints_return_seeded_data(): void
    {
        $this->seed();

        $this->getJson('/api/v1/categories')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Alimentos naturales');

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Miel natural de monte']);
    }

    public function test_buyer_can_login_and_add_product_to_cart(): void
    {
        $this->seed();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'maria@compradora.com',
            'password' => 'password',
        ])->assertOk();

        $token = $login->json('data.token');
        $product = Product::query()->firstOrFail();

        $this->withToken($token)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $product->id,
                'quantity' => 2,
            ])
            ->assertCreated()
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.items.0.unit_price_cents_snapshot', $product->price_cents);
    }

    public function test_seller_can_access_dashboard(): void
    {
        $this->seed();

        $seller = User::query()->where('email', 'verde@amanecer.com')->firstOrFail();

        $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk()
            ->assertJsonPath('data.products_count', 3);
    }

    public function test_pending_seller_cannot_publish_active_product(): void
    {
        $this->seed();

        $seller = User::query()->create([
            'name' => 'Pending Seller',
            'email' => 'pending-seller@example.com',
            'password' => 'password',
            'role' => 'seller',
            'status' => 'active',
        ]);

        ProducerProfile::query()->create([
            'user_id' => $seller->id,
            'business_name' => 'Productor Pendiente',
            'slug' => 'productor-pendiente',
            'status' => 'pending',
        ]);

        $category = Category::query()->firstOrFail();

        $this->actingAs($seller, 'sanctum')
            ->postJson('/api/v1/seller/products', [
                'category_id' => $category->id,
                'name' => 'Producto pendiente',
                'price_cents' => 100000,
                'stock' => 1,
                'unit' => 'unidad',
                'status' => 'active',
            ])
            ->assertForbidden();
    }

    public function test_checkout_splits_orders_by_producer(): void
    {
        $this->seed();

        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();
        $category = Category::query()->firstOrFail();

        $seller = User::query()->create([
            'name' => 'Segundo Productor',
            'email' => 'seller-two@example.com',
            'password' => 'password',
            'role' => 'seller',
            'status' => 'active',
        ]);

        $profile = ProducerProfile::query()->create([
            'user_id' => $seller->id,
            'business_name' => 'Segundo Campo',
            'slug' => 'segundo-campo',
            'status' => 'active',
        ]);

        $secondProduct = Product::query()->create([
            'producer_profile_id' => $profile->id,
            'category_id' => $category->id,
            'name' => 'Producto segundo productor',
            'slug' => 'producto-segundo-productor',
            'price_cents' => 250000,
            'currency' => 'ARS',
            'stock' => 3,
            'unit' => 'unidad',
            'status' => 'active',
        ]);

        $firstProduct = Product::query()->firstOrFail();

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $firstProduct->id, 'quantity' => 1])
            ->assertCreated();

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $secondProduct->id, 'quantity' => 1])
            ->assertCreated();

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/checkout/cart', ['delivery_type' => 'local'])
            ->assertCreated()
            ->assertJsonPath('data.orders_count', 2);
    }

    public function test_cart_and_checkout_keep_price_snapshot_when_product_price_changes(): void
    {
        $this->seed();

        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();
        $product = Product::query()->firstOrFail();
        $originalPrice = $product->price_cents;

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 2])
            ->assertCreated()
            ->assertJsonPath('data.items.0.unit_price_cents_snapshot', $originalPrice);

        $product->update(['price_cents' => $originalPrice + 50000]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/cart/checkout-preview')
            ->assertOk()
            ->assertJsonPath('data.subtotal_cents', $originalPrice * 2);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/checkout/cart', ['delivery_type' => 'local'])
            ->assertCreated()
            ->assertJsonPath('data.orders.0.items.0.unit_price_cents', $originalPrice)
            ->assertJsonPath('data.orders.0.items.0.line_total_cents', $originalPrice * 2);
    }

    public function test_admin_cannot_use_buyer_or_seller_marketplace_actions(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@mercadoahora.com')->firstOrFail();
        $product = Product::query()->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])
            ->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/seller/dashboard')
            ->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertOk();
    }

    public function test_buyer_registration_login_me_and_logout_flow(): void
    {
        $register = $this->postJson('/api/v1/auth/register', [
            'name' => 'Comprador Nuevo',
            'email' => 'new-buyer@example.com',
            'password' => 'password123',
        ])->assertCreated()
            ->assertJsonPath('data.user.role', 'buyer');

        $token = $register->json('data.token');

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'new-buyer@example.com')
            ->assertJsonPath('data.role', 'buyer');

        $this->withToken($token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'new-buyer@example.com',
            'password' => 'password123',
        ])->assertOk();

        $this->withToken($login->json('data.token'))
            ->getJson('/api/v1/cart')
            ->assertOk();
    }

    public function test_seller_registration_creates_pending_profile_and_admin_can_review_it(): void
    {
        $this->seed();

        $sellerResponse = $this->postJson('/api/v1/auth/register-seller', [
            'name' => 'Productor Nuevo',
            'email' => 'new-seller@example.com',
            'password' => 'password123',
            'business_name' => 'Chacra Nueva',
            'province' => 'Cordoba',
            'city' => 'Alta Gracia',
            'story' => 'Produccion familiar regional.',
        ])->assertCreated()
            ->assertJsonPath('data.user.role', 'seller')
            ->assertJsonPath('data.user.producer_profile.status', 'pending');

        $sellerToken = $sellerResponse->json('data.token');
        $category = Category::query()->firstOrFail();

        $this->withToken($sellerToken)
            ->postJson('/api/v1/seller/products', [
                'category_id' => $category->id,
                'name' => 'Producto nuevo pendiente',
                'price_cents' => 100000,
                'stock' => 2,
                'unit' => 'unidad',
                'status' => 'active',
            ])
            ->assertForbidden();

        $admin = User::query()->where('email', 'admin@mercadoahora.com')->firstOrFail();
        $profile = ProducerProfile::query()->whereHas('user', fn ($query) => $query->where('email', 'new-seller@example.com'))->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/producers/{$profile->id}/approve", ['approval_notes' => 'Aprobado para QA.'])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $seller = User::query()->where('email', 'new-seller@example.com')->firstOrFail();

        $this->actingAs($seller->refresh(), 'sanctum')
            ->postJson('/api/v1/seller/products', [
                'category_id' => $category->id,
                'name' => 'Producto nuevo activo',
                'price_cents' => 100000,
                'stock' => 2,
                'unit' => 'unidad',
                'status' => 'active',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'active');
    }

    public function test_non_admin_and_non_seller_route_guards_are_enforced(): void
    {
        $this->seed();

        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();
        $seller = User::query()->where('email', 'verde@amanecer.com')->firstOrFail();

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertForbidden();

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/v1/seller/dashboard')
            ->assertForbidden();

        $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertForbidden();
    }

    public function test_email_verification_and_password_reset_placeholders_are_available(): void
    {
        $this->seed();

        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();

        $this->postJson('/api/v1/auth/password/forgot', ['email' => $buyer->email])
            ->assertOk()
            ->assertJsonPath('data.message', 'Flujo preparado para Fase 1.');

        $this->postJson('/api/v1/auth/password/reset', ['email' => $buyer->email])
            ->assertOk()
            ->assertJsonPath('data.message', 'Flujo preparado para Fase 1.');

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/auth/email/verify')
            ->assertOk()
            ->assertJsonPath('data.message', 'Verificación preparada.');
    }
}
