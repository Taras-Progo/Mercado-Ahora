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
            if ($existing->status === 'preference_created') {
                return $this->responseData($existing);
            }

            throw new HttpResponseException(response()->json([
                'message' => 'Este intento de pago ya está siendo procesado. Esperá unos segundos antes de reintentar.',
            ], 409));
        }

        $expiresAt = now()->addMinutes((int) config('services.mercado_pago.reservation_minutes', 30));
        $intent = DB::transaction(fn () => $this->createPendingCheckout($buyer, $cart, $data, $expiresAt));

        try {
            $preference = $this->gateway->createPreference(
                $this->preferencePayload($intent),
                $idempotencyKey,
            );
        } catch (PaymentGatewayException $exception) {
            DB::transaction(function () use ($intent): void {
                $intent->reservations()->where('status', 'active')->update([
                    'status' => 'released',
                    'released_at' => now(),
                ]);
                $intent->orders()->update(['payment_status' => 'failed']);
                $intent->update(['status' => 'failed']);
            });

            throw new HttpResponseException(response()->json([
                'message' => $exception->getMessage(),
            ], 503));
        }

        $intent->update([
            'status' => 'preference_created',
            'external_id' => (string) $preference['id'],
            'preference_id' => (string) $preference['id'],
            'checkout_url' => $preference['init_point'] ?? null,
            'sandbox_checkout_url' => $preference['sandbox_init_point'] ?? null,
            'payload' => [
                'collector_id' => $preference['collector_id'] ?? null,
                'operation_type' => $preference['operation_type'] ?? null,
            ],
        ]);

        $cart->items()->delete();

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
                'cart_item' => $cartItem,
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
        $intent->load('orders.items');
        $items = $intent->orders->flatMap(fn (Order $order) => $order->items->map(fn ($item) => [
            'id' => (string) $item->product_id,
            'title' => $item->product_name,
            'currency_id' => 'ARS',
            'quantity' => (int) $item->quantity,
            'unit_price' => round($item->unit_price_cents / 100, 2),
        ]))->values()->all();

        return [
            'items' => $items,
            'payer' => ['email' => $intent->buyer->email],
            'external_reference' => $intent->internal_reference,
            'notification_url' => (string) config('services.mercado_pago.webhook_url'),
            'back_urls' => [
                'success' => (string) config('services.mercado_pago.success_url'),
                'pending' => (string) config('services.mercado_pago.pending_url'),
                'failure' => (string) config('services.mercado_pago.failure_url'),
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
    }

    /** @return array<string, mixed> */
    private function responseData(PaymentIntent $intent): array
    {
        $intent->load('orders.items.product.producerProfile', 'reservations');
        $checkoutUrl = $intent->mode === 'sandbox'
            ? ($intent->sandbox_checkout_url ?: $intent->checkout_url)
            : $intent->checkout_url;

        return [
            'payment_intent' => $intent,
            'orders' => $intent->orders,
            'orders_count' => $intent->orders->count(),
            'checkout_url' => $checkoutUrl,
            'expires_at' => $intent->expires_at?->toIso8601String(),
            'message' => 'Pago preparado. Te redirigiremos a Mercado Pago.',
        ];
    }
}
