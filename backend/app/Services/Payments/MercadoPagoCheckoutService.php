<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Exceptions\PaymentGatewayException;
use App\Models\Cart;
use App\Models\Order;
use App\Models\PaymentIntent;
use App\Models\Product;
use App\Models\StockReservation;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MercadoPagoCheckoutService
{
    public function __construct(private readonly PaymentGateway $gateway)
    {
    }

    /** @return array<string, mixed> */
    public function start(User $buyer, Cart $cart, array $data): array
    {
        $idempotencyKey = $data['idempotency_key'];
        $existing = PaymentIntent::query()
            ->where('buyer_id', $buyer->id)
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing) {
            if (in_array($existing->status, ['pending', 'preference_created'], true)) {
                return $this->responseData($existing);
            }

            throw new HttpResponseException(response()->json([
                'message' => 'Este intento de pago ya fue utilizado. Generá un nuevo intento para continuar.',
            ], 409));
        }

        $expiresAt = now()->addMinutes((int) config('services.mercado_pago.reservation_minutes', 30));
        $intent = DB::transaction(fn () => $this->createPendingCheckout($buyer, $cart, $data, $expiresAt));

        return $this->createPreference($intent, $idempotencyKey, $cart);
    }

    /** @return array<string, mixed> */
    public function startBuyNow(User $buyer, Product $product, int $quantity, array $data): array
    {
        $idempotencyKey = $data['idempotency_key'];
        $existing = PaymentIntent::query()
            ->where('buyer_id', $buyer->id)
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing) {
            if (in_array($existing->status, ['pending', 'preference_created'], true)) {
                return $this->responseData($existing);
            }

            throw new HttpResponseException(response()->json([
                'message' => 'Este intento de pago ya fue utilizado. Genera un nuevo intento para continuar.',
            ], 409));
        }

        $expiresAt = now()->addMinutes((int) config('services.mercado_pago.reservation_minutes', 30));
        $intent = DB::transaction(
            fn () => $this->createPendingBuyNow($buyer, $product, $quantity, $data, $expiresAt),
        );

        return $this->createPreference($intent, $idempotencyKey);
    }

    /** @return array<string, mixed> */
    public function retry(User $buyer, PaymentIntent $failedIntent, string $idempotencyKey): array
    {
        if ($failedIntent->buyer_id !== $buyer->id) {
            abort(403);
        }

        if (! in_array($failedIntent->status, ['rejected', 'cancelled', 'expired', 'failed'], true)) {
            throw new HttpResponseException(response()->json([
                'message' => 'Este pago no admite un nuevo intento.',
            ], 422));
        }

        $expiresAt = now()->addMinutes((int) config('services.mercado_pago.reservation_minutes', 30));
        $intent = DB::transaction(function () use ($failedIntent, $buyer, $idempotencyKey, $expiresAt): PaymentIntent {
            $orderIds = $failedIntent->orders()->pluck('orders.id');

            $blockingIntent = PaymentIntent::query()
                ->where('id', '!=', $failedIntent->id)
                ->whereIn('status', ['creating', 'pending', 'preference_created', 'approved'])
                ->whereHas('orders', fn ($query) => $query->whereIn('orders.id', $orderIds))
                ->lockForUpdate()
                ->first();

            if ($blockingIntent) {
                throw new HttpResponseException(response()->json([
                    'message' => $blockingIntent->status === 'approved'
                        ? 'Este pedido ya tiene un pago aprobado.'
                        : 'Ya existe otro pago pendiente para este pedido.',
                ], 409));
            }

            $orders = Order::query()->with('items')->whereIn('id', $orderIds)->orderBy('id')->lockForUpdate()->get();
            $conflicts = [];

            foreach ($orders->flatMap->items as $item) {
                $product = Product::query()->lockForUpdate()->find($item->product_id);
                $reserved = StockReservation::query()
                    ->where('product_id', $item->product_id)
                    ->where('status', 'active')
                    ->where('expires_at', '>', now())
                    ->sum('quantity');
                $available = max(0, (int) ($product?->stock ?? 0) - (int) $reserved);

                if (! $product || $product->status !== 'active' || $item->quantity > $available) {
                    $conflicts[] = [
                        'item_id' => null,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product_name,
                        'requested_quantity' => (int) $item->quantity,
                        'available_stock' => $available,
                        'status' => $product?->status ?? 'unavailable',
                    ];
                }
            }

            if ($conflicts !== []) {
                throw new HttpResponseException(response()->json([
                    'message' => 'No hay stock suficiente para volver a intentar este pago.',
                    'conflicts' => $conflicts,
                ], 422));
            }

            $intent = PaymentIntent::query()->create([
                'order_id' => $orders->first()->id,
                'buyer_id' => $buyer->id,
                'internal_reference' => (string) Str::uuid(),
                'idempotency_key' => $idempotencyKey,
                'provider' => 'mercado_pago',
                'mode' => (string) config('services.mercado_pago.mode', 'sandbox'),
                'amount_cents' => $orders->sum('total_cents'),
                'currency' => 'ARS',
                'status' => 'creating',
                'expires_at' => $expiresAt,
                'reserved_at' => now(),
            ]);
            $intent->orders()->attach($orderIds);

            foreach ($orders as $order) {
                $order->update(['status' => 'pending', 'payment_status' => 'pending']);
                $order->statusHistory()->create([
                    'changed_by' => $buyer->id,
                    'status' => 'pending',
                    'note' => 'Se inició un nuevo intento de pago con Mercado Pago.',
                ]);

                foreach ($order->items as $item) {
                    StockReservation::query()->create([
                        'payment_intent_id' => $intent->id,
                        'order_id' => $order->id,
                        'order_item_id' => $item->id,
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                        'status' => 'active',
                        'expires_at' => $expiresAt,
                    ]);
                }
            }

            return $intent;
        }, 3);

        return $this->createPreference($intent, $idempotencyKey);
    }

    /** @return array<string, mixed> */
    private function createPreference(PaymentIntent $intent, string $idempotencyKey, ?Cart $cart = null): array
    {
        try {
            $preference = $this->gateway->createPreference($this->preferencePayload($intent), $idempotencyKey);
        } catch (PaymentGatewayException $exception) {
            DB::transaction(function () use ($intent): void {
                $intent->reservations()->where('status', 'active')->update(['status' => 'released', 'released_at' => now()]);
                $intent->orders()->update(['status' => 'cancelled', 'payment_status' => 'failed']);
                $intent->update(['status' => 'failed', 'processing_error' => $exception->getMessage()]);
            });

            throw new HttpResponseException(response()->json(['message' => $exception->getMessage()], 503));
        }

        $intent->update([
            'status' => 'pending',
            'external_id' => (string) $preference['id'],
            'preference_id' => (string) $preference['id'],
            'checkout_url' => $preference['init_point'] ?? null,
            'sandbox_checkout_url' => $preference['sandbox_init_point'] ?? null,
            'payload' => [
                'collector_id' => $preference['collector_id'] ?? null,
                'operation_type' => $preference['operation_type'] ?? null,
            ],
        ]);

        $cart?->items()->delete();

        return $this->responseData($intent->fresh());
    }

    private function createPendingCheckout(User $buyer, Cart $cart, array $data, $expiresAt): PaymentIntent
    {
        $cartItems = $cart->items()->with('product')->get();
        if ($cartItems->isEmpty()) {
            throw new HttpResponseException(response()->json(['message' => 'El carrito está vacío.'], 422));
        }

        $prepared = [];
        $conflicts = [];
        foreach ($cartItems as $cartItem) {
            $product = Product::query()->lockForUpdate()->findOrFail($cartItem->product_id);
            $reserved = StockReservation::query()
                ->where('product_id', $product->id)
                ->where('status', 'active')
                ->where('expires_at', '>', now())
                ->sum('quantity');
            $available = max(0, (int) $product->stock - (int) $reserved);

            if ($product->status !== 'active' || $cartItem->quantity > $available) {
                $conflicts[] = [
                    'item_id' => $cartItem->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'requested_quantity' => (int) $cartItem->quantity,
                    'available_stock' => $available,
                    'status' => $product->status,
                ];
                continue;
            }

            $prepared[] = [
                'product' => $product,
                'quantity' => (int) $cartItem->quantity,
                'unit_price_cents' => (int) $product->price_cents,
            ];
        }

        if ($conflicts !== []) {
            throw new HttpResponseException(response()->json([
                'message' => 'No pudimos reservar todos los productos. Revisá las cantidades disponibles.',
                'conflicts' => $conflicts,
            ], 422));
        }

        $orders = collect($prepared)
            ->groupBy(fn (array $item) => $item['product']->producer_profile_id)
            ->map(fn ($items) => $this->createPendingOrder($buyer, $items->all(), $data))
            ->values();

        $intent = PaymentIntent::query()->create([
            'order_id' => $orders->first()->id,
            'buyer_id' => $buyer->id,
            'internal_reference' => (string) Str::uuid(),
            'idempotency_key' => $data['idempotency_key'],
            'provider' => 'mercado_pago',
            'mode' => (string) config('services.mercado_pago.mode', 'sandbox'),
            'amount_cents' => $orders->sum('total_cents'),
            'currency' => 'ARS',
            'status' => 'creating',
            'expires_at' => $expiresAt,
            'reserved_at' => now(),
        ]);

        $intent->orders()->attach($orders->pluck('id'));
        foreach ($orders as $order) {
            foreach ($order->items as $orderItem) {
                StockReservation::query()->create([
                    'payment_intent_id' => $intent->id,
                    'order_id' => $order->id,
                    'order_item_id' => $orderItem->id,
                    'product_id' => $orderItem->product_id,
                    'quantity' => $orderItem->quantity,
                    'status' => 'active',
                    'expires_at' => $expiresAt,
                ]);
            }
        }

        return $intent;
    }

    private function createPendingBuyNow(
        User $buyer,
        Product $requestedProduct,
        int $quantity,
        array $data,
        $expiresAt,
    ): PaymentIntent {
        $product = Product::query()->lockForUpdate()->findOrFail($requestedProduct->id);
        $reserved = StockReservation::query()
            ->where('product_id', $product->id)
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->sum('quantity');
        $available = max(0, (int) $product->stock - (int) $reserved);

        if ($product->status !== 'active' || $quantity > $available) {
            throw new HttpResponseException(response()->json([
                'message' => $product->status !== 'active'
                    ? 'Este producto ya no esta disponible para comprar.'
                    : 'No hay stock suficiente para completar la compra.',
                'conflicts' => [[
                    'item_id' => null,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'requested_quantity' => $quantity,
                    'available_stock' => $available,
                    'status' => $product->status,
                ]],
            ], 422));
        }

        $order = $this->createPendingOrder($buyer, [[
            'product' => $product,
            'quantity' => $quantity,
            'unit_price_cents' => (int) $product->price_cents,
        ]], $data);

        $intent = PaymentIntent::query()->create([
            'order_id' => $order->id,
            'buyer_id' => $buyer->id,
            'internal_reference' => (string) Str::uuid(),
            'idempotency_key' => $data['idempotency_key'],
            'provider' => 'mercado_pago',
            'mode' => (string) config('services.mercado_pago.mode', 'sandbox'),
            'amount_cents' => $order->total_cents,
            'currency' => 'ARS',
            'status' => 'creating',
            'expires_at' => $expiresAt,
            'reserved_at' => now(),
        ]);

        $intent->orders()->attach($order->id);
        foreach ($order->items as $orderItem) {
            StockReservation::query()->create([
                'payment_intent_id' => $intent->id,
                'order_id' => $order->id,
                'order_item_id' => $orderItem->id,
                'product_id' => $orderItem->product_id,
                'quantity' => $orderItem->quantity,
                'status' => 'active',
                'expires_at' => $expiresAt,
            ]);
        }

        return $intent;
    }

    private function createPendingOrder(User $buyer, array $items, array $data): Order
    {
        $subtotal = collect($items)->sum(fn (array $item) => $item['unit_price_cents'] * $item['quantity']);
        $order = Order::query()->create([
            'buyer_id' => $buyer->id,
            'order_number' => 'MA-'.now()->format('Ymd').'-'.str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT),
            'status' => 'pending',
            'payment_status' => 'pending',
            'delivery_type' => $data['delivery_type'] ?? null,
            'delivery_address' => $data['delivery_address'] ?? null,
            'city' => $data['city'] ?? null,
            'province' => $data['province'] ?? null,
            'subtotal_cents' => $subtotal,
            'delivery_cents' => 0,
            'total_cents' => $subtotal,
            'buyer_note' => $data['buyer_note'] ?? null,
        ]);

        foreach ($items as $item) {
            $product = $item['product'];
            $order->items()->create([
                'product_id' => $product->id,
                'producer_profile_id' => $product->producer_profile_id,
                'product_name' => $product->name,
                'unit_price_cents' => $item['unit_price_cents'],
                'quantity' => $item['quantity'],
                'line_total_cents' => $item['unit_price_cents'] * $item['quantity'],
            ]);
        }

        $order->statusHistory()->create([
            'changed_by' => $buyer->id,
            'status' => 'pending',
            'note' => 'Pedido creado. Pago con Mercado Pago pendiente.',
        ]);

        return $order->load('items.product.producerProfile', 'statusHistory');
    }

    /** @return array<string, mixed> */
    private function preferencePayload(PaymentIntent $intent): array
    {
        $intent->load('orders.items', 'buyer');
        $items = $intent->orders->flatMap(fn (Order $order) => $order->items->map(fn ($item) => [
            'id' => (string) $item->product_id,
            'title' => $item->product_name,
            'currency_id' => 'ARS',
            'quantity' => (int) $item->quantity,
            'unit_price' => round($item->unit_price_cents / 100, 2),
        ]))->values()->all();

        $referenceQuery = '?reference='.rawurlencode((string) $intent->internal_reference);

        $payload = [
            'items' => $items,
            'external_reference' => $intent->internal_reference,
            'notification_url' => (string) config('services.mercado_pago.webhook_url'),
            'back_urls' => [
                'success' => rtrim((string) config('services.mercado_pago.success_url'), '?&').$referenceQuery,
                'pending' => rtrim((string) config('services.mercado_pago.pending_url'), '?&').$referenceQuery,
                'failure' => rtrim((string) config('services.mercado_pago.failure_url'), '?&').$referenceQuery,
            ],
            'payment_methods' => [
                'excluded_payment_types' => [
                    ['id' => 'ticket'],
                    ['id' => 'atm'],
                    ['id' => 'bank_transfer'],
                ],
            ],
            'auto_return' => 'approved',
            'expires' => true,
            'expiration_date_from' => $intent->reserved_at->toIso8601String(),
            'expiration_date_to' => $intent->expires_at->toIso8601String(),
            'statement_descriptor' => 'MERCADO AHORA',
            'metadata' => [
                'payment_intent_id' => $intent->id,
                'order_ids' => $intent->orders->pluck('id')->all(),
            ],
        ];

        // Sandbox must use a Mercado Pago test buyer. A real marketplace email
        // can prevent otherwise valid test cards from being accepted.
        if ($intent->mode !== 'sandbox') {
            $payload['payer'] = ['email' => $intent->buyer->email];
        }

        return $payload;
    }

    /** @return array<string, mixed> */
    public function responseData(PaymentIntent $intent): array
    {
        $intent->load('orders.items.product.producerProfile');
        // Test users work through Checkout Pro's regular init point. The legacy
        // sandbox login URL can loop during the first test-account sign-in.
        $checkoutUrl = $intent->checkout_url ?: $intent->sandbox_checkout_url;

        return [
            'payment_intent' => [
                'id' => $intent->id,
                'reference' => $intent->internal_reference,
                'provider' => $intent->provider,
                'mode' => $intent->mode,
                'status' => $intent->status,
                'preference_id' => $intent->preference_id,
                'amount_cents' => $intent->amount_cents,
                'currency' => $intent->currency,
                'expires_at' => $intent->expires_at?->toIso8601String(),
            ],
            'orders' => $intent->orders,
            'orders_count' => $intent->orders->count(),
            'checkout_url' => $checkoutUrl,
            'expires_at' => $intent->expires_at?->toIso8601String(),
            'message' => 'Pago preparado. Te redirigiremos a Mercado Pago.',
        ];
    }
}