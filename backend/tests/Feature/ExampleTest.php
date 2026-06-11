<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProducerProfile;
use App\Models\User;
use App\Models\ProductImage;
use App\Models\ProductFavorite;
use App\Notifications\FrontendResetPasswordNotification;
use App\Notifications\FrontendVerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
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

    public function test_public_product_search_is_case_insensitive_and_returns_images_for_active_products(): void
    {
        $category = Category::query()->create([
            'name' => 'Alimentos naturales',
            'slug' => 'alimentos-naturales',
        ]);

        $seller = User::factory()->create([
            'name' => 'Gabriel Londero',
            'role' => 'seller',
            'status' => 'active',
        ]);

        $profile = ProducerProfile::query()->create([
            'user_id' => $seller->id,
            'business_name' => 'Apiario del Valle',
            'slug' => 'apiario-del-valle',
            'province' => 'Córdoba',
            'city' => 'Córdoba',
            'status' => 'active',
        ]);

        $activeProduct = Product::query()->create([
            'producer_profile_id' => $profile->id,
            'category_id' => $category->id,
            'name' => 'Miel Artesanal',
            'slug' => 'miel-artesanal',
            'description' => 'Miel pura de monte.',
            'price_cents' => 500000,
            'currency' => 'ARS',
            'stock' => 7,
            'unit' => 'frasco',
            'city' => 'Villa del Prado',
            'province' => null,
            'status' => 'active',
        ]);

        ProductImage::query()->create([
            'product_id' => $activeProduct->id,
            'path' => 'products/miel-artesanal.jpg',
            'is_primary' => false,
            'sort_order' => 0,
        ]);

        foreach (['draft', 'paused'] as $status) {
            Product::query()->create([
                'producer_profile_id' => $profile->id,
                'category_id' => $category->id,
                'name' => "Miel {$status}",
                'slug' => "miel-{$status}",
                'price_cents' => 100000,
                'currency' => 'ARS',
                'stock' => 1,
                'unit' => 'frasco',
                'status' => $status,
            ]);
        }

        $this->assertDatabaseHas('products', [
            'name' => 'Miel Artesanal',
            'status' => 'active',
        ]);

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Miel Artesanal']);

        $this->getJson('/api/v1/products?q=miel')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Miel Artesanal'])
            ->assertJsonFragment(['province' => 'Córdoba'])
            ->assertJsonFragment(['city' => 'Villa del Prado'])
            ->assertJsonFragment(['path' => 'products/miel-artesanal.jpg'])
            ->assertJsonMissing(['name' => 'Miel draft'])
            ->assertJsonMissing(['name' => 'Miel paused']);

        $this->getJson('/api/v1/products?q=gabriel')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Miel Artesanal']);

        $this->getJson('/api/v1/products?province=C%C3%B3rdoba')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Miel Artesanal']);
    }

    public function test_catalog_filters_return_only_active_product_provinces_with_counts(): void
    {
        $food = Category::query()->create([
            'name' => 'Alimentos naturales',
            'slug' => 'alimentos-naturales',
        ]);
        $crafts = Category::query()->create([
            'name' => 'Artesanias',
            'slug' => 'artesanias',
        ]);

        $seller = User::factory()->create([
            'role' => 'seller',
            'status' => 'active',
        ]);

        $profile = ProducerProfile::query()->create([
            'user_id' => $seller->id,
            'business_name' => 'Apiario Cordoba',
            'slug' => 'apiario-cordoba',
            'province' => 'Córdoba',
            'city' => 'Córdoba',
            'status' => 'active',
        ]);

        $base = [
            'producer_profile_id' => $profile->id,
            'price_cents' => 100000,
            'currency' => 'ARS',
            'stock' => 5,
            'unit' => 'unidad',
        ];

        Product::query()->create($base + [
            'category_id' => $food->id,
            'name' => 'Miel de monte',
            'slug' => 'miel-de-monte',
            'province' => ' Córdoba ',
            'status' => 'active',
        ]);
        Product::query()->create($base + [
            'category_id' => $food->id,
            'name' => 'Miel cremosa',
            'slug' => 'miel-cremosa',
            'province' => 'Córdoba',
            'status' => 'active',
        ]);
        Product::query()->create($base + [
            'category_id' => $crafts->id,
            'name' => 'Tabla artesanal',
            'slug' => 'tabla-artesanal',
            'province' => 'Mendoza',
            'status' => 'active',
        ]);
        Product::query()->create($base + [
            'category_id' => $food->id,
            'name' => 'Miel borrador',
            'slug' => 'miel-borrador',
            'province' => 'Salta',
            'status' => 'draft',
        ]);
        Product::query()->create($base + [
            'category_id' => $food->id,
            'name' => 'Miel sin provincia',
            'slug' => 'miel-sin-provincia',
            'province' => '   ',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/v1/catalog/filters')
            ->assertOk();

        $this->assertSame([
            ['value' => 'Córdoba', 'label' => 'Córdoba', 'count' => 3],
            ['value' => 'Mendoza', 'label' => 'Mendoza', 'count' => 1],
        ], $response->json('data.provinces'));

        $this->getJson('/api/v1/catalog/filters?q=miel')
            ->assertOk()
            ->assertJsonPath('data.provinces', [
                ['value' => 'Córdoba', 'label' => 'Córdoba', 'count' => 3],
            ]);

        $this->getJson('/api/v1/catalog/filters?category=artesanias')
            ->assertOk()
            ->assertJsonPath('data.provinces', [
                ['value' => 'Mendoza', 'label' => 'Mendoza', 'count' => 1],
            ]);
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

    public function test_user_can_favorite_and_unfavorite_active_products(): void
    {
        $category = Category::query()->create([
            'name' => 'Alimentos naturales',
            'slug' => 'alimentos-naturales',
        ]);

        $seller = User::factory()->create([
            'role' => 'seller',
            'status' => 'active',
        ]);

        $profile = ProducerProfile::query()->create([
            'user_id' => $seller->id,
            'business_name' => 'Apiario Favorito',
            'slug' => 'apiario-favorito',
            'province' => 'Cordoba',
            'city' => 'Alta Gracia',
            'status' => 'active',
        ]);

        $activeProduct = Product::query()->create([
            'producer_profile_id' => $profile->id,
            'category_id' => $category->id,
            'name' => 'Miel favorita',
            'slug' => 'miel-favorita',
            'price_cents' => 500000,
            'currency' => 'ARS',
            'stock' => 8,
            'unit' => 'frasco',
            'status' => 'active',
        ]);

        ProductImage::query()->create([
            'product_id' => $activeProduct->id,
            'path' => 'products/miel-favorita.jpg',
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        $draftProduct = Product::query()->create([
            'producer_profile_id' => $profile->id,
            'category_id' => $category->id,
            'name' => 'Miel borrador',
            'slug' => 'miel-borrador-favoritos',
            'price_cents' => 400000,
            'currency' => 'ARS',
            'stock' => 4,
            'unit' => 'frasco',
            'status' => 'draft',
        ]);

        $buyer = User::factory()->create([
            'role' => 'buyer',
            'status' => 'active',
        ]);

        $this->postJson("/api/v1/favorites/products/{$activeProduct->id}")
            ->assertUnauthorized();

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/v1/favorites/products/{$draftProduct->id}")
            ->assertUnprocessable();

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/v1/favorites/products/{$activeProduct->id}")
            ->assertCreated()
            ->assertJsonPath('data.favorited', true)
            ->assertJsonPath('data.product.name', 'Miel favorita')
            ->assertJsonPath('data.product.province', 'Cordoba')
            ->assertJsonFragment(['path' => 'products/miel-favorita.jpg']);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/v1/favorites/products/{$activeProduct->id}")
            ->assertOk()
            ->assertJsonPath('data.favorited', true);

        $this->assertSame(1, ProductFavorite::query()->where([
            'user_id' => $buyer->id,
            'product_id' => $activeProduct->id,
        ])->count());

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/v1/favorites/ids')
            ->assertOk()
            ->assertJsonPath('data', [$activeProduct->id]);

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/v1/favorites')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Miel favorita'])
            ->assertJsonMissing(['name' => 'Miel borrador']);

        $this->actingAs($buyer, 'sanctum')
            ->deleteJson("/api/v1/favorites/products/{$activeProduct->id}")
            ->assertOk()
            ->assertJsonPath('data.favorited', false)
            ->assertJsonPath('data.product_id', $activeProduct->id);

        $this->assertDatabaseMissing('product_favorites', [
            'user_id' => $buyer->id,
            'product_id' => $activeProduct->id,
        ]);
    }

    public function test_favorites_are_private_active_only_and_removed_with_product(): void
    {
        $category = Category::query()->create([
            'name' => 'Categoria favoritos',
            'slug' => 'categoria-favoritos',
        ]);

        $seller = User::factory()->create([
            'role' => 'seller',
            'status' => 'active',
        ]);

        $profile = ProducerProfile::query()->create([
            'user_id' => $seller->id,
            'business_name' => 'Productor Favoritos',
            'slug' => 'productor-favoritos',
            'status' => 'active',
        ]);

        $activeProduct = Product::query()->create([
            'producer_profile_id' => $profile->id,
            'category_id' => $category->id,
            'name' => 'Producto privado favorito',
            'slug' => 'producto-privado-favorito',
            'price_cents' => 100000,
            'currency' => 'ARS',
            'stock' => 5,
            'unit' => 'unidad',
            'status' => 'active',
        ]);

        $pausedProduct = Product::query()->create([
            'producer_profile_id' => $profile->id,
            'category_id' => $category->id,
            'name' => 'Producto pausado favorito',
            'slug' => 'producto-pausado-favorito',
            'price_cents' => 100000,
            'currency' => 'ARS',
            'stock' => 5,
            'unit' => 'unidad',
            'status' => 'paused',
        ]);

        $buyer = User::factory()->create([
            'role' => 'buyer',
            'status' => 'active',
        ]);

        $otherBuyer = User::factory()->create([
            'role' => 'buyer',
            'status' => 'active',
        ]);

        ProductFavorite::query()->create([
            'user_id' => $buyer->id,
            'product_id' => $activeProduct->id,
        ]);

        ProductFavorite::query()->create([
            'user_id' => $buyer->id,
            'product_id' => $pausedProduct->id,
        ]);

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/v1/favorites')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Producto privado favorito'])
            ->assertJsonMissing(['name' => 'Producto pausado favorito']);

        $this->actingAs($otherBuyer, 'sanctum')
            ->getJson('/api/v1/favorites/ids')
            ->assertOk()
            ->assertJsonPath('data', []);

        $activeProduct->delete();

        $this->assertDatabaseMissing('product_favorites', [
            'user_id' => $buyer->id,
            'product_id' => $activeProduct->id,
        ]);
    }

    public function test_login_with_wrong_password_returns_invalid_credentials(): void
    {
        $this->seed();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'maria@compradora.com',
            'password' => 'wrong-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_auth_me_returns_compact_user_payload_with_seller_profile_summary(): void
    {
        $seller = User::factory()->create([
            'role' => 'seller',
            'status' => 'active',
            'phone' => '+54 9 351 555 1234',
        ]);

        ProducerProfile::query()->create([
            'user_id' => $seller->id,
            'business_name' => 'Apiario del Valle',
            'slug' => 'apiario-del-valle',
            'description' => 'Descripcion larga que no debe viajar en cada validacion de sesion.',
            'status' => 'active',
        ]);

        $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $seller->id)
            ->assertJsonPath('data.email', $seller->email)
            ->assertJsonPath('data.role', 'seller')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.producer_profile.business_name', 'Apiario del Valle')
            ->assertJsonPath('data.producer_profile.slug', 'apiario-del-valle')
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.producer_profile.description');
    }

    public function test_auth_me_rejects_invalid_token(): void
    {
        $this->withHeader('Authorization', 'Bearer invalid-token')
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_seller_can_access_dashboard(): void
    {
        $this->seed();

        $seller = User::query()->where('email', 'verde@amanecer.com')->firstOrFail();

        $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk()
            ->assertJsonPath('data.products_count', 3)
            ->assertJsonStructure(['data' => ['profile_completion_percent']]);
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

    public function test_checkout_decrements_stock(): void
    {
        $this->seed();

        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();
        $product = Product::query()->where('stock', '>=', 2)->firstOrFail();
        $originalStock = $product->stock;

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 2])
            ->assertCreated();

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/checkout/cart', ['delivery_type' => 'local'])
            ->assertCreated();

        $this->assertSame($originalStock - 2, $product->refresh()->stock);
    }

    public function test_seller_status_update_creates_history_and_buyer_sees_new_status(): void
    {
        $this->seed();

        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();
        $product = Product::query()->with('producerProfile.user')->where('status', 'active')->firstOrFail();
        $seller = $product->producerProfile->user;

        $orderResponse = $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/checkout/buy-now', [
                'product_id' => $product->id,
                'quantity' => 1,
                'delivery_type' => 'local',
            ])
            ->assertCreated();

        $orderId = $orderResponse->json('data.id');

        $this->actingAs($seller, 'sanctum')
            ->patchJson("/api/v1/seller/orders/{$orderId}/status", [
                'status' => 'confirmed',
                'note' => 'Pedido confirmado por el productor.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonFragment(['status' => 'confirmed'])
            ->assertJsonFragment(['note' => 'Pedido confirmado por el productor.']);

        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $orderId,
            'changed_by' => $seller->id,
            'status' => 'confirmed',
        ]);

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonFragment(['id' => $orderId, 'status' => 'confirmed']);
    }

    public function test_seller_can_create_and_reuse_order_conversation_for_their_order(): void
    {
        $this->seed();

        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();
        $product = Product::query()->with('producerProfile.user')->where('status', 'active')->firstOrFail();
        $seller = $product->producerProfile->user;

        $orderResponse = $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/checkout/buy-now', [
                'product_id' => $product->id,
                'quantity' => 1,
                'delivery_type' => 'local',
            ])
            ->assertCreated();

        $orderId = $orderResponse->json('data.id');

        $first = $this->actingAs($seller, 'sanctum')
            ->postJson("/api/v1/seller/orders/{$orderId}/conversation")
            ->assertCreated()
            ->assertJsonPath('data.order_id', $orderId)
            ->assertJsonPath('data.buyer_id', $buyer->id)
            ->assertJsonPath('data.producer_profile_id', $product->producer_profile_id);

        $conversationId = $first->json('data.id');

        $this->assertSame(1, Conversation::query()->where('order_id', $orderId)->count());
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversationId,
            'sender_id' => $seller->id,
        ]);

        $this->actingAs($seller, 'sanctum')
            ->postJson("/api/v1/seller/orders/{$orderId}/conversation")
            ->assertOk()
            ->assertJsonPath('data.id', $conversationId);

        $this->assertSame(1, Conversation::query()->where('order_id', $orderId)->count());
        $this->assertSame(1, Conversation::query()->findOrFail($conversationId)->messages()->count());
    }

    public function test_seller_cannot_create_order_conversation_for_another_producer_order(): void
    {
        $this->seed();

        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();
        $product = Product::query()->with('producerProfile.user')->where('status', 'active')->firstOrFail();

        $otherSeller = User::factory()->create([
            'role' => 'seller',
            'status' => 'active',
        ]);
        ProducerProfile::query()->create([
            'user_id' => $otherSeller->id,
            'business_name' => 'Otro Productor',
            'slug' => 'otro-productor',
            'status' => 'active',
        ]);

        $orderResponse = $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/checkout/buy-now', [
                'product_id' => $product->id,
                'quantity' => 1,
                'delivery_type' => 'local',
            ])
            ->assertCreated();

        $this->actingAs($otherSeller, 'sanctum')
            ->postJson('/api/v1/seller/orders/'.$orderResponse->json('data.id').'/conversation')
            ->assertNotFound();
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

    public function test_admin_can_temporarily_reset_active_user_password(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@mercadoahora.com')->firstOrFail();
        $buyer = User::query()->where('email', 'maria@compradora.com')->firstOrFail();
        $buyer->createToken('web');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/users/{$buyer->id}/password", [
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ])
            ->assertOk()
            ->assertJsonPath('data.user.email', 'maria@compradora.com');

        $this->assertCount(0, $buyer->tokens()->get());

        $this->postJson('/api/v1/auth/login', [
            'email' => 'maria@compradora.com',
            'password' => 'new-password-123',
        ])->assertOk();
    }

    public function test_seller_sees_only_their_received_orders_and_status_changes_are_tracked(): void
    {
        $this->seed();

        $seller = User::query()->where('email', 'finca@raicesverdes.com')->firstOrFail();

        $response = $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/seller/orders')
            ->assertOk();

        $orders = collect($response->json('data'));
        $this->assertTrue($orders->isNotEmpty());
        $this->assertTrue($orders->every(fn ($order) => collect($order['items'])->every(
            fn ($item) => (int) $item['product']['producer_profile_id'] === $seller->producerProfile->id
        )));

        $orderId = $orders->first()['id'];

        $this->actingAs($seller, 'sanctum')
            ->patchJson("/api/v1/seller/orders/{$orderId}/status", ['status' => 'processing'])
            ->assertOk()
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonFragment(['status' => 'processing']);

        $this->actingAs($seller, 'sanctum')
            ->patchJson("/api/v1/seller/orders/{$orderId}/status", ['status' => 'invalid-status'])
            ->assertUnprocessable();
    }

    public function test_product_image_upload_validates_file_and_marks_first_image_primary(): void
    {
        if (! class_exists(\finfo::class)) {
            $this->markTestSkipped('The fileinfo extension is required for upload validation tests.');
        }

        Storage::fake('public');
        $this->seed();

        $seller = User::query()->where('email', 'verde@amanecer.com')->firstOrFail();
        $product = $seller->producerProfile->products()->create([
            'category_id' => Category::query()->firstOrFail()->id,
            'name' => 'Producto con imagen',
            'slug' => 'producto-con-imagen',
            'price_cents' => 100000,
            'currency' => 'ARS',
            'stock' => 5,
            'unit' => 'unidad',
            'status' => 'draft',
        ]);

        $this->actingAs($seller, 'sanctum')
            ->postJson("/api/v1/seller/products/{$product->id}/images", [
                'image' => UploadedFile::fake()->create('document.pdf', 20, 'application/pdf'),
            ])
            ->assertUnprocessable();

        $this->actingAs($seller, 'sanctum')
            ->postJson("/api/v1/seller/products/{$product->id}/images", [
                'image' => UploadedFile::fake()->image('product.jpg', 800, 800),
            ])
            ->assertCreated()
            ->assertJsonPath('data.is_primary', true);

        Storage::disk('public')->assertExists($product->images()->firstOrFail()->path);
    }

    public function test_seller_can_delete_product_without_order_history(): void
    {
        $this->seed();

        $seller = User::query()->where('email', 'verde@amanecer.com')->firstOrFail();
        $product = $seller->producerProfile->products()->create([
            'category_id' => Category::query()->firstOrFail()->id,
            'name' => 'Producto eliminable',
            'slug' => 'producto-eliminable',
            'price_cents' => 100000,
            'currency' => 'ARS',
            'stock' => 5,
            'unit' => 'unidad',
            'status' => 'draft',
        ]);

        $this->actingAs($seller, 'sanctum')
            ->deleteJson("/api/v1/seller/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.action', 'deleted');

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_seller_delete_product_with_order_history_pauses_it(): void
    {
        $this->seed();

        $product = Product::query()->whereHas('orderItems')->firstOrFail();
        $seller = $product->producerProfile->user;

        $this->actingAs($seller, 'sanctum')
            ->deleteJson("/api/v1/seller/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.action', 'paused');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'status' => 'paused',
        ]);
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

    public function test_email_verification_sends_signed_email_and_marks_user_verified(): void
    {
        Notification::fake();
        config(['app.frontend_url' => 'http://localhost']);

        $buyer = User::factory()->create([
            'email' => 'verify-me@example.com',
            'email_verified_at' => null,
            'role' => 'buyer',
            'status' => 'active',
        ]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/v1/auth/email/verify')
            ->assertOk()
            ->assertJsonPath('data.message', 'Te enviamos un email de verificacion.');

        Notification::assertSentTo($buyer, FrontendVerifyEmailNotification::class);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $buyer->id,
                'hash' => sha1($buyer->email),
            ],
        );

        $this->get($verificationUrl)
            ->assertRedirect('http://localhost/verificar-email?status=verified');

        $this->assertNotNull($buyer->fresh()->email_verified_at);
    }

    public function test_auth_emails_are_branded_and_fully_spanish(): void
    {
        config(['app.frontend_url' => 'https://mercadoahora.com.ar']);

        $buyer = User::factory()->create([
            'name' => 'Gabriel',
            'email' => 'gabriel@example.com',
            'role' => 'buyer',
            'status' => 'active',
        ]);

        $resetMail = (new FrontendResetPasswordNotification('reset-token-123'))->toMail($buyer);
        $resetHtml = (string) $resetMail->render();

        $this->assertSame('Restablecé tu contraseña en Mercado Ahora', $resetMail->subject);
        $this->assertStringContainsString('Creá una nueva contraseña', $resetHtml);
        $this->assertStringContainsString('Crear nueva contraseña', $resetHtml);
        $this->assertStringContainsString('Si el botón no abre correctamente', $resetHtml);
        $this->assertStringContainsString('reset-token-123', $resetHtml);
        $this->assertStringContainsString('/brand/mercado-ahora-logo.png', $resetHtml);
        $this->assertStringContainsString('Productos reales, productores locales y compras más conscientes.', $resetHtml);
        $this->assertStringNotContainsString('Regards', $resetHtml);
        $this->assertStringNotContainsString("If you're having trouble clicking", $resetHtml);

        $verifyMail = (new FrontendVerifyEmailNotification())->toMail($buyer);
        $verifyHtml = (string) $verifyMail->render();

        $this->assertSame('Verificá tu email en Mercado Ahora', $verifyMail->subject);
        $this->assertStringContainsString('Verificá tu email', $verifyHtml);
        $this->assertStringContainsString('Verificar mi email', $verifyHtml);
        $this->assertStringContainsString('Mercado Ahora', $verifyHtml);
        $this->assertStringNotContainsString('Regards', $verifyHtml);
        $this->assertStringNotContainsString("If you're having trouble clicking", $verifyHtml);
    }

    public function test_password_reset_sends_email_and_updates_password(): void
    {
        $buyer = User::factory()->create([
            'email' => 'reset-me@example.com',
            'password' => 'old-password-123',
            'role' => 'buyer',
            'status' => 'active',
        ]);

        $this->postJson('/api/v1/auth/password/forgot', ['email' => $buyer->email])
            ->assertOk()
            ->assertJsonPath('data.message', 'Si el email existe, te enviamos un enlace para restablecer la contraseña.');

        $resetToken = Password::broker()->createToken($buyer);

        $this->postJson('/api/v1/auth/password/reset', [
            'email' => $buyer->email,
            'token' => $resetToken,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])
            ->assertOk()
            ->assertJsonPath('data.message', 'Contraseña actualizada. Ya podés iniciar sesión.');

        $this->postJson('/api/v1/auth/login', [
            'email' => $buyer->email,
            'password' => 'new-password-123',
        ])->assertOk();
    }

    public function test_seller_dashboard_counts_processing_orders_and_real_profile_completion(): void
    {
        $seller = User::factory()->create([
            'role' => 'seller',
            'status' => 'active',
        ]);

        $profile = ProducerProfile::query()->create([
            'user_id' => $seller->id,
            'business_name' => 'Perfil Minimo',
            'slug' => 'perfil-minimo',
            'status' => 'active',
        ]);

        $category = Category::query()->create([
            'name' => 'Categoria prueba',
            'slug' => 'categoria-prueba',
        ]);

        $product = Product::query()->create([
            'producer_profile_id' => $profile->id,
            'category_id' => $category->id,
            'name' => 'Producto dashboard',
            'slug' => 'producto-dashboard',
            'price_cents' => 100000,
            'currency' => 'ARS',
            'stock' => 5,
            'unit' => 'unidad',
            'status' => 'active',
        ]);

        $buyer = User::factory()->create([
            'role' => 'buyer',
            'status' => 'active',
        ]);

        $order = Order::query()->create([
            'buyer_id' => $buyer->id,
            'order_number' => 'MA-TEST-001',
            'status' => 'processing',
            'payment_status' => 'not_started',
            'subtotal_cents' => 100000,
            'delivery_cents' => 0,
            'total_cents' => 100000,
        ]);

        OrderItem::query()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'producer_profile_id' => $profile->id,
            'product_name' => $product->name,
            'unit_price_cents' => $product->price_cents,
            'quantity' => 1,
            'line_total_cents' => $product->price_cents,
        ]);

        $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk()
            ->assertJsonPath('data.pending_orders_count', 1)
            ->assertJsonPath('data.profile_completion_percent', 10);
    }
}
