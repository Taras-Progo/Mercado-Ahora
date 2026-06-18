<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return $this->cartResponse($request);
    }

    public function addItem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'note' => ['nullable', 'string'],
        ]);

        $product = Product::query()->where('status', 'active')->findOrFail($data['product_id']);

        $cart = $request->user()->cart()->firstOrCreate();
        $item = $cart->items()->firstOrNew(['product_id' => $data['product_id']]);
        $requestedQuantity = ($item->exists ? $item->quantity : 0) + ($data['quantity'] ?? 1);

        if ($product->stock !== null && $requestedQuantity > $product->stock) {
            $this->abortStockConflict($item, $product, $requestedQuantity);
        }

        if (! $item->exists || $item->unit_price_cents_snapshot === null) {
            $item->product_name_snapshot = $product->name;
            $item->unit_price_cents_snapshot = $product->price_cents;
            $item->currency_snapshot = $product->currency;
        }
        $item->quantity = $requestedQuantity;
        $item->note = $data['note'] ?? $item->note;
        $item->save();

        return $this->cartResponse($request, 201);
    }

    public function updateItem(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string'],
        ]);

        $item = $request->user()->cart()->firstOrCreate()->items()->findOrFail($id);

        $product = Product::query()->find($item->product_id);
        if ($product && $product->stock !== null && $data['quantity'] > $product->stock) {
            $this->abortStockConflict($item, $product, $data['quantity']);
        }

        $item->update($data);

        return $this->cartResponse($request);
    }

    public function removeItem(Request $request, int $id): JsonResponse
    {
        $request->user()->cart()->firstOrCreate()->items()->findOrFail($id)->delete();

        return $this->cartResponse($request);
    }

    public function delivery(Request $request): JsonResponse
    {
        $data = $request->validate(['delivery_type' => ['required', 'string', 'max:120']]);
        $request->user()->cart()->firstOrCreate()->update($data);

        return $this->cartResponse($request);
    }

    public function preview(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->summary($this->cart($request))]);
    }

    private function cartResponse(Request $request, int $status = 200): JsonResponse
    {
        return $this->noStore(response()->json(['data' => $this->cart($request)], $status));
    }

    private function cart(Request $request)
    {
        $cart = $request->user()->cart()->firstOrCreate();

        return $cart->fresh([
            'items.product.category',
            'items.product.images',
            'items.product.producerProfile',
        ]);
    }

    private function summary($cart): array
    {
        $subtotal = $cart->items->sum(fn ($item) => $item->quantity * $this->unitPriceSnapshot($item));

        return [
            'cart' => $cart,
            'subtotal_cents' => $subtotal,
            'delivery_cents' => 0,
            'total_cents' => $subtotal,
        ];
    }

    private function unitPriceSnapshot($item): int
    {
        return $item->unit_price_cents_snapshot ?? $item->product->price_cents;
    }

    private function abortStockConflict(CartItem $item, Product $product, int $requestedQuantity): never
    {
        $conflict = [
            'item_id' => $item->exists ? $item->id : null,
            'product_id' => $product->id,
            'product_name' => $item->product_name_snapshot ?: $product->name,
            'requested_quantity' => $requestedQuantity,
            'available_stock' => $product->stock ?? 0,
            'status' => $product->status,
        ];

        throw new HttpResponseException($this->noStore(response()->json([
            'message' => "Stock insuficiente. Solo quedan {$conflict['available_stock']} disponibles.",
            'conflicts' => [$conflict],
        ], 422)));
    }

    private function noStore(JsonResponse $response): JsonResponse
    {
        return $response->withHeaders([
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }
}
