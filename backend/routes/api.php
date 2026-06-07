<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\ProductImageController;
use App\Http\Controllers\Api\SellerController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/register-seller', [AuthController::class, 'registerSeller']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/password/forgot', fn () => response()->json(['data' => ['message' => 'Flujo preparado para Fase 1.']]));
    Route::post('/auth/password/reset', fn () => response()->json(['data' => ['message' => 'Flujo preparado para Fase 1.']]));

    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/categories/{slug}', [CatalogController::class, 'category']);
    Route::get('/categories/{slug}/products', [CatalogController::class, 'products']);
    Route::get('/products', [CatalogController::class, 'products']);
    Route::get('/products/{slug}', [CatalogController::class, 'product']);
    Route::get('/products/{slug}/related', [CatalogController::class, 'related']);
    Route::get('/products/{slug}/reviews', [CatalogController::class, 'reviews']);
    Route::get('/producers', [CatalogController::class, 'producers']);
    Route::get('/producers/{id}', [CatalogController::class, 'producer']);
    Route::get('/search/products', [CatalogController::class, 'products']);
    Route::get('/search/producers', [CatalogController::class, 'producers']);
    Route::post('/payments/webhooks/{provider}', [PaymentWebhookController::class, 'store']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/email/verify', fn () => response()->json(['data' => ['message' => 'Verificación preparada.']]));

        Route::get('/users/me', [AuthController::class, 'me']);

        // Any authenticated buyer (or previously rejected seller) can apply to
        // become a producer with their existing account — no second email needed.
        Route::post('/seller/apply', [SellerController::class, 'apply']);

        Route::middleware('role:buyer,seller')->group(function () {
            Route::get('/cart', [CartController::class, 'show']);
            Route::post('/cart/items', [CartController::class, 'addItem']);
            Route::patch('/cart/items/{id}', [CartController::class, 'updateItem']);
            Route::delete('/cart/items/{id}', [CartController::class, 'removeItem']);
            Route::patch('/cart/delivery', [CartController::class, 'delivery']);
            Route::post('/cart/coupon', fn () => response()->json(['data' => ['message' => 'Cupones quedan para fase futura.']]));
            Route::post('/cart/checkout-preview', [CartController::class, 'preview']);

            Route::post('/checkout/buy-now', [OrderController::class, 'buyNow']);
            Route::post('/checkout/cart', [OrderController::class, 'checkoutCart']);
            Route::get('/orders', [OrderController::class, 'buyerOrders']);
            Route::get('/orders/{id}', [OrderController::class, 'show']);
            Route::get('/orders/{id}/tracking', [OrderController::class, 'tracking']);
            Route::post('/orders/{id}/returns', [OrderController::class, 'requestReturn']);
            Route::get('/returns', [OrderController::class, 'returns']);
            Route::post('/orders/{id}/payment-intent', [OrderController::class, 'createPaymentIntent']);
            Route::get('/orders/{id}/payment', [OrderController::class, 'paymentStatus']);

            Route::get('/conversations', [ChatController::class, 'index']);
            Route::post('/conversations', [ChatController::class, 'store']);
            Route::get('/conversations/{id}', [ChatController::class, 'show']);
            Route::get('/conversations/{id}/messages', [ChatController::class, 'messages']);
            Route::post('/conversations/{id}/messages', [ChatController::class, 'send']);
            Route::post('/conversations/{id}/stock-question', [ChatController::class, 'stockQuestion']);
        });

        Route::middleware('role:seller')->group(function () {
            Route::get('/seller/profile', [SellerController::class, 'profile']);
            Route::post('/seller/profile', [SellerController::class, 'saveProfile']);
            Route::patch('/seller/profile', [SellerController::class, 'saveProfile']);
            Route::get('/seller/social-links', [SellerController::class, 'socialLinks']);
            Route::post('/seller/social-links', [SellerController::class, 'saveSocialLink']);
            Route::get('/seller/dashboard', [SellerController::class, 'dashboard']);
            Route::get('/seller/products', [SellerController::class, 'products']);
            Route::post('/seller/products', [SellerController::class, 'storeProduct']);
            Route::get('/seller/products/{id}', [SellerController::class, 'showProduct']);
            Route::patch('/seller/products/{id}', [SellerController::class, 'updateProduct']);
            Route::delete('/seller/products/{id}', [SellerController::class, 'destroyProduct']);
            Route::patch('/seller/products/{id}/pause', [SellerController::class, 'pauseProduct']);
            Route::patch('/seller/products/{id}/publish', [SellerController::class, 'publishProduct']);
            Route::get('/seller/orders', [OrderController::class, 'sellerOrders']);
            Route::get('/seller/orders/{id}', [OrderController::class, 'sellerOrder']);
            Route::patch('/seller/orders/{id}/status', [OrderController::class, 'updateSellerStatus']);
            Route::get('/seller/returns', [OrderController::class, 'returns']);
            Route::post('/seller/products/{product}/images', [ProductImageController::class, 'store']);
            Route::patch('/seller/products/{product}/images/{image}', [ProductImageController::class, 'update']);
            Route::delete('/seller/products/{product}/images/{image}', [ProductImageController::class, 'destroy']);
        });

        Route::middleware('role:admin')->group(function () {
            Route::get('/admin/users', [AdminController::class, 'users']);
            Route::get('/admin/users/{id}', [AdminController::class, 'user']);
            Route::patch('/admin/users/{id}/status', [AdminController::class, 'updateUserStatus']);
            Route::patch('/admin/users/{id}/password', [AdminController::class, 'resetUserPassword']);
            Route::get('/admin/producers', [AdminController::class, 'producers']);
            Route::patch('/admin/producers/{id}/status', [AdminController::class, 'updateProducerStatus']);
            Route::patch('/admin/producers/{id}/approve', [AdminController::class, 'approveProducer']);
            Route::patch('/admin/producers/{id}/reject', [AdminController::class, 'rejectProducer']);
            Route::get('/admin/products', [AdminController::class, 'products']);
            Route::patch('/admin/products/{id}/approve', [AdminController::class, 'approveProduct']);
            Route::patch('/admin/products/{id}/reject', [AdminController::class, 'rejectProduct']);
            Route::patch('/admin/products/{id}/status', [AdminController::class, 'updateProductStatus']);
            Route::patch('/admin/products/{id}/ecoscore', [AdminController::class, 'validateEcoScore']);
            Route::get('/admin/orders', [AdminController::class, 'orders']);
            Route::get('/admin/orders/{id}', [AdminController::class, 'order']);
            Route::patch('/admin/orders/{id}/status', [AdminController::class, 'updateOrderStatus']);
            Route::get('/admin/returns', [AdminController::class, 'returns']);
            Route::patch('/admin/returns/{id}/status', [AdminController::class, 'updateReturnStatus']);
        });
    });
});
