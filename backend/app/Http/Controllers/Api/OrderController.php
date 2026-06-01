<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentIntent;
use App\Models\Product;
use App\Models\ReturnRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function buyNow(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'delivery_type' => ['nullable', 'string', 'max:120'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'province' => ['nullable', 'string', 'max:120'],
            'buyer_note' => ['nullable', 'string'],
        ]);

        $product = Product::query()->where('status', 'active')->findOrFail($data['product_id']);
        $quantity = $data['quantity'] ?? 1;

        if ($product->stock !== null && $quantity > $product->stock) {
            abort(422, "Stock insuficiente. Solo quedan {$product->stock} disponibles.");
        }

        return response()->json([
            'data' => $this->createOrder($request, [$this->orderItemFromProduct($product, $quantity)], $data),
        ], 201);
    }

    public function checkoutCart(Request $request): JsonResponse
    {
        $data = $request->validate([
            'delivery_type' => ['nullable', 'string', 'max:120'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'province' => ['nullable', 'string', 'max:120'],
            'buyer_note' => ['nullable', 'string'],
        ]);

        $cart = $request->user()->cart()->firstOrCreate()->load('items.product');

        if ($cart->items->isEmpty()) {
            abort(422, 'El carrito está vacío.');
        }

        $items = $cart->items->map(fn ($item) => [
            'product' => $item->product,
            'quantity' => $item->quantity,
            'product_name' => $item->product_name_snapshot ?? $item->product->name,
            'unit_price_cents' => $item->unit_price_cents_snapshot ?? $item->product->price_cents,
        ])->all();

        // Validate stock for all cart items
        foreach ($items as $item) {
            $product = $item['product'];
            if ($product->stock !== null && $item['quantity'] > $product->stock) {
                abort(422, "Stock insuficiente para \"{$product->name}\". Solo quedan {$product->stock} disponibles.");
            }
            if ($product->status !== 'active') {
                abort(422, "El producto \"{$product->name}\" ya no está disponible.");
            }
        }

        $orders = $this->createGroupedOrders($request, $items, $data + ['delivery_type' => $cart->delivery_type]);
        $cart->items()->delete();

        return response()->json([
            'data' => [
                'orders' => $orders,
                'orders_count' => count($orders),
                'message' => 'Checkout único procesado. Se generaron pedidos separados por productor.',
            ],
        ], 201);
    }

    public function buyerOrders(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->orders()->with('items.product.producerProfile')->latest()->get(),
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $order = Order::query()->with('items.product.producerProfile', 'statusHistory')->findOrFail($id);

        if (! $request->user()->isAdmin() && $order->buyer_id !== $request->user()->id) {
            abort(403);
        }

        return response()->json(['data' => $order]);
    }

    public function tracking(Request $request, int $id): JsonResponse
    {
        $order = $request->user()->orders()->with('statusHistory')->findOrFail($id);

        return response()->json(['data' => $order->statusHistory]);
    }

    public function sellerOrders(Request $request): JsonResponse
    {
        $profile = $request->user()->producerProfile ?? abort(422, 'Perfil de productor requerido.');

        return response()->json([
            'data' => Order::query()
                ->with('items.product')
                ->whereHas('items', fn ($query) => $query->where('producer_profile_id', $profile->id))
                ->latest()
                ->get(),
        ]);
    }

    public function sellerOrder(Request $request, int $id): JsonResponse
    {
        $profile = $request->user()->producerProfile ?? abort(422, 'Perfil de productor requerido.');

        return response()->json([
            'data' => Order::query()
                ->with('items.product', 'buyer', 'statusHistory')
                ->whereHas('items', fn ($query) => $query->where('producer_profile_id', $profile->id))
                ->findOrFail($id),
        ]);
    }

    public function updateSellerStatus(Request $request, int $id): JsonResponse
    {
        $profile = $request->user()->producerProfile ?? abort(422, 'Perfil de productor requerido.');
        $data = $request->validate(['status' => ['required', 'string', 'max:30'], 'note' => ['nullable', 'string']]);

        $order = Order::query()
            ->whereHas('items', fn ($query) => $query->where('producer_profile_id', $profile->id))
            ->findOrFail($id);

        $order->update(['status' => $data['status']]);
        $order->statusHistory()->create([
            'changed_by' => $request->user()->id,
            'status' => $data['status'],
            'note' => $data['note'] ?? null,
        ]);

        return response()->json(['data' => $order->load('statusHistory')]);
    }

    public function returns(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ReturnRequest::query()->where('buyer_id', $request->user()->id)->latest()->get(),
        ]);
    }

    public function requestReturn(Request $request, int $orderId): JsonResponse
    {
        $order = $request->user()->orders()->findOrFail($orderId);
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
        ]);

        $return = ReturnRequest::query()->create([
            ...$data,
            'order_id' => $order->id,
            'buyer_id' => $request->user()->id,
            'status' => 'open',
        ]);

        return response()->json(['data' => $return], 201);
    }

    public function createPaymentIntent(Request $request, int $orderId): JsonResponse
    {
        $order = $request->user()->orders()->findOrFail($orderId);

        $intent = PaymentIntent::query()->firstOrCreate(
            ['order_id' => $order->id],
            [
                'provider' => 'manual',
                'amount_cents' => $order->total_cents,
                'currency' => 'ARS',
                'status' => 'prepared',
            ],
        );

        return response()->json([
            'data' => $intent,
            'meta' => ['message' => 'Estructura de pago preparada. Mercado Pago se integra en fase futura.'],
        ]);
    }

    public function paymentStatus(Request $request, int $orderId): JsonResponse
    {
        $order = $request->user()->orders()->with('items')->findOrFail($orderId);

        return response()->json([
            'data' => [
                'order_id' => $order->id,
                'payment_status' => $order->payment_status,
                'intent' => PaymentIntent::query()->where('order_id', $order->id)->first(),
            ],
        ]);
    }

    private function createOrder(Request $request, array $items, array $data): Order
    {
        return DB::transaction(function () use ($request, $items, $data) {
            $subtotal = collect($items)->sum(fn ($item) => $item['unit_price_cents'] * $item['quantity']);

            $order = Order::query()->create([
                'buyer_id' => $request->user()->id,
                'order_number' => 'MA-'.now()->format('Ymd').'-'.str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT),
                'status' => 'pending',
                'payment_status' => 'not_started',
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
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price_cents'];

                $order->items()->create([
                    'product_id' => $product->id,
                    'producer_profile_id' => $product->producer_profile_id,
                    'product_name' => $item['product_name'],
                    'unit_price_cents' => $unitPrice,
                    'quantity' => $quantity,
                    'line_total_cents' => $unitPrice * $quantity,
                ]);

                // Decrement stock
                if ($product->stock !== null) {
                    $product->decrement('stock', $quantity);
                }
            }

            $order->statusHistory()->create([
                'changed_by' => $request->user()->id,
                'status' => 'pending',
                'note' => 'Pedido creado.',
            ]);

            return $order->load('items.product.producerProfile', 'statusHistory');
        });
    }

    private function createGroupedOrders(Request $request, array $items, array $data): array
    {
        $groups = collect($items)->groupBy(fn ($item) => $item['product']->producer_profile_id);

        return DB::transaction(function () use ($request, $groups, $data) {
            return $groups
                ->map(fn ($producerItems) => $this->createOrder($request, $producerItems->all(), $data))
                ->values()
                ->all();
        });
    }

    private function orderItemFromProduct(Product $product, int $quantity): array
    {
        return [
            'product' => $product,
            'quantity' => $quantity,
            'product_name' => $product->name,
            'unit_price_cents' => $product->price_cents,
        ];
    }
}
