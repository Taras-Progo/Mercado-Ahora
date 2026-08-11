<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\PaymentIntent;
use App\Models\Product;
use App\Models\ReturnRequest;
use App\Services\Payments\PaymentSummaryService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
            'item_id' => $item->id,
            'product_id' => $item->product->id,
            'producer_profile_id' => $item->product->producer_profile_id,
            'product' => $item->product,
            'quantity' => $item->quantity,
            'product_name' => $item->product_name_snapshot ?? $item->product->name,
            'unit_price_cents' => $item->unit_price_cents_snapshot ?? $item->product->price_cents,
        ])->all();

        $conflicts = [];
        foreach ($items as $item) {
            $product = $item['product'];

            if ($product->status !== 'active') {
                $conflicts[] = $this->checkoutConflict($item, $product->stock ?? 0, $product->status);
                continue;
            }

            if ($product->stock !== null && $item['quantity'] > $product->stock) {
                $conflicts[] = $this->checkoutConflict($item, $product->stock, $product->status);
            }
        }

        if (! empty($conflicts)) {
            $this->abortCheckoutConflicts($conflicts);
        }

        $orders = $this->createGroupedOrders($request, $items, $data + ['delivery_type' => $cart->delivery_type]);
        $cart->items()->delete();

        return response()->json([
            'data' => [
                'orders' => $orders,
                'orders_count' => count($orders),
                'message' => 'Compra confirmada. Se generaron pedidos separados por productor.',
            ],
        ], 201);
    }

    public function buyerOrders(Request $request, PaymentSummaryService $payments): JsonResponse
    {
        $orders = $request->user()->orders()
            ->with('items.product.producerProfile', 'statusHistory', 'returnRequests', 'paymentIntents')
            ->latest()
            ->get();

        return response()->json(['data' => $payments->attachToOrders($orders)]);
    }

    public function show(Request $request, int $id, PaymentSummaryService $payments): JsonResponse
    {
        $order = Order::query()
            ->with('items.product.producerProfile', 'statusHistory', 'returnRequests', 'paymentIntents')
            ->findOrFail($id);

        if (! $request->user()->isAdmin() && $order->buyer_id !== $request->user()->id) {
            abort(403);
        }

        $order->setAttribute('payment_summary', $payments->forOrder($order));

        return response()->json(['data' => $order]);
    }

    public function tracking(Request $request, int $id): JsonResponse
    {
        $order = $request->user()->orders()->with('statusHistory')->findOrFail($id);

        return response()->json(['data' => $order->statusHistory]);
    }

    public function sellerOrders(Request $request, PaymentSummaryService $payments): JsonResponse
    {
        $profile = $request->user()->producerProfile ?? abort(422, 'Perfil de productor requerido.');
        $orders = Order::query()
            ->with('buyer', 'items.product', 'returnRequests', 'paymentIntents')
            ->whereHas('items', fn ($query) => $query->where('producer_profile_id', $profile->id))
            ->latest()
            ->get();

        return response()->json(['data' => $payments->attachToOrders($orders)]);
    }

    public function sellerOrder(Request $request, int $id, PaymentSummaryService $payments): JsonResponse
    {
        $profile = $request->user()->producerProfile ?? abort(422, 'Perfil de productor requerido.');
        $order = Order::query()
            ->with('items.product', 'buyer', 'statusHistory', 'returnRequests', 'paymentIntents')
            ->whereHas('items', fn ($query) => $query->where('producer_profile_id', $profile->id))
            ->findOrFail($id);
        $order->setAttribute('payment_summary', $payments->forOrder($order));

        return response()->json(['data' => $order]);
    }

    public function updateSellerStatus(Request $request, int $id): JsonResponse
    {
        $profile = $request->user()->producerProfile ?? abort(422, 'Perfil de productor requerido.');
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])],
            'note' => ['nullable', 'string'],
        ]);

        $order = Order::query()
            ->with('paymentIntents')
            ->whereHas('items', fn ($query) => $query->where('producer_profile_id', $profile->id))
            ->findOrFail($id);

        $mercadoPagoIntent = $order->paymentIntents->firstWhere('provider', 'mercado_pago');
        if ($mercadoPagoIntent && $order->payment_status !== 'approved') {
            abort(422, 'El pago con Mercado Pago todavía no fue aprobado. No podés preparar ni enviar este pedido.');
        }

        $order->update(['status' => $data['status']]);
        $order->statusHistory()->create([
            'changed_by' => $request->user()->id,
            'status' => $data['status'],
            'note' => $data['note'] ?? null,
        ]);

        return response()->json(['data' => $order->load('statusHistory', 'returnRequests')]);
    }

    public function sellerOrderConversation(Request $request, int $id): JsonResponse
    {
        $profile = $request->user()->producerProfile ?? abort(422, 'Perfil de productor requerido.');

        $order = Order::query()
            ->with(['items.product', 'buyer'])
            ->whereHas('items', fn ($query) => $query->where('producer_profile_id', $profile->id))
            ->findOrFail($id);

        $firstItem = $order->items->first();

        $conversation = Conversation::query()->firstOrCreate(
            ['order_id' => $order->id],
            [
                'buyer_id' => $order->buyer_id,
                'producer_profile_id' => $profile->id,
                'product_id' => $firstItem?->product_id,
                'status' => 'open',
                'last_message_at' => now(),
            ],
        );

        if ($conversation->wasRecentlyCreated) {
            $conversation->messages()->create([
                'sender_id' => $request->user()->id,
                'body' => "Hola {$order->buyer?->name}, te escribo por el pedido {$order->order_number} para coordinar los detalles.",
            ]);
            $conversation->update(['last_message_at' => now()]);
        }

        return response()->json([
            'data' => $conversation->load('buyer', 'producerProfile.user', 'product', 'order', 'messages.sender'),
        ], $conversation->wasRecentlyCreated ? 201 : 200);
    }

    public function returns(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ReturnRequest::query()
                ->with('order.items.product', 'buyer')
                ->where('buyer_id', $request->user()->id)
                ->latest()
                ->get(),
        ]);
    }

    public function sellerReturns(Request $request): JsonResponse
    {
        $profile = $request->user()->producerProfile ?? abort(422, 'Perfil de productor requerido.');

        return response()->json([
            'data' => ReturnRequest::query()
                ->with('buyer', 'order.items.product', 'order.statusHistory')
                ->whereHas('order.items', fn ($query) => $query->where('producer_profile_id', $profile->id))
                ->latest()
                ->get(),
        ]);
    }

    public function requestReturn(Request $request, int $orderId): JsonResponse
    {
        $order = $request->user()->orders()->with('returnRequests')->findOrFail($orderId);
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
        ]);

        if ($order->status !== 'delivered') {
            abort(422, 'Solo se puede solicitar una devolución de pedidos entregados.');
        }

        if ($order->returnRequests()->exists()) {
            abort(422, 'Ya existe una solicitud de devolución para este pedido.');
        }

        $return = ReturnRequest::query()->create([
            ...$data,
            'order_id' => $order->id,
            'buyer_id' => $request->user()->id,
            'status' => 'open',
        ]);

        return response()->json(['data' => $return->load('order.items.product', 'buyer')], 201);
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
        return DB::transaction(fn () => $this->createOrderRecord($request, $items, $data));
    }

    private function createGroupedOrders(Request $request, array $items, array $data): array
    {
        $groups = collect($items)->groupBy(fn ($item) => $item['producer_profile_id'] ?? $item['product']->producer_profile_id);

        return DB::transaction(function () use ($request, $groups, $data) {
            return $groups
                ->map(fn ($producerItems) => $this->createOrderRecord($request, $producerItems->all(), $data))
                ->values()
                ->all();
        });
    }

    private function createOrderRecord(Request $request, array $items, array $data): Order
    {
        $items = $this->prepareOrderItems($items);
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
    }

    private function prepareOrderItems(array $items): array
    {
        return collect($items)
            ->map(function (array $item) {
                $productId = $item['product_id'] ?? $item['product']->id ?? null;
                $product = Product::query()->lockForUpdate()->findOrFail($productId);
                $quantity = (int) $item['quantity'];

                if ($product->status !== 'active') {
                    $this->abortCheckoutConflicts([
                        $this->checkoutConflict($item, $product->stock ?? 0, $product->status),
                    ]);
                }

                if ($product->stock !== null && $quantity > $product->stock) {
                    $this->abortCheckoutConflicts([
                        $this->checkoutConflict($item, $product->stock, $product->status),
                    ]);
                }

                return [
                    'item_id' => $item['item_id'] ?? null,
                    'product' => $product,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'product_name' => $item['product_name'] ?? $product->name,
                    'unit_price_cents' => $item['unit_price_cents'] ?? $product->price_cents,
                ];
            })
            ->all();
    }

    private function orderItemFromProduct(Product $product, int $quantity): array
    {
        return [
            'product' => $product,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'product_name' => $product->name,
            'unit_price_cents' => $product->price_cents,
        ];
    }

    private function checkoutConflict(array $item, int $availableStock, ?string $status = null): array
    {
        return [
            'item_id' => $item['item_id'] ?? null,
            'product_id' => $item['product_id'] ?? $item['product']->id,
            'product_name' => $item['product_name'] ?? $item['product']->name,
            'requested_quantity' => (int) $item['quantity'],
            'available_stock' => $availableStock,
            'status' => $status,
        ];
    }

    private function abortCheckoutConflicts(array $conflicts): never
    {
        $first = $conflicts[0];
        $message = ($first['status'] ?? 'active') !== 'active'
            ? "El producto \"{$first['product_name']}\" ya no está disponible."
            : "Stock insuficiente para \"{$first['product_name']}\". Solo quedan {$first['available_stock']} disponibles.";

        throw new HttpResponseException(response()->json([
            'message' => $message,
            'conflicts' => $conflicts,
        ], 422));
    }
}
