<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->cart($request)]);
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
            abort(422, "Stock insuficiente. Solo quedan {$product->stock} disponibles.");
        }

        if (! $item->exists || $item->unit_price_cents_snapshot === null) {
            $item->product_name_snapshot = $product->name;
            $item->unit_price_cents_snapshot = $product->price_cents;
            $item->currency_snapshot = $product->currency;
        }
        $item->quantity = $requestedQuantity;
        $item->note = $data['note'] ?? $item->note;
        $item->save();

        return response()->json(['data' => $this->cart($request)], 201);
    }

    public function updateItem(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string'],
        ]);

        $item = $request->user()->cart()->firstOrCreate()->items()->findOrFail($id);

        $product = $item->product;
        if ($product && $product->stock !== null && $data['quantity'] > $product->stock) {
            abort(422, "Stock insuficiente. Solo quedan {$product->stock} disponibles.");
        }

        $item->update($data);

        return response()->json(['data' => $this->cart($request)]);
    }

    public function removeItem(Request $request, int $id): JsonResponse
    {
        $request->user()->cart()->firstOrCreate()->items()->findOrFail($id)->delete();

        return response()->json(['data' => $this->cart($request)]);
    }

    public function delivery(Request $request): JsonResponse
    {
        $data = $request->validate(['delivery_type' => ['required', 'string', 'max:120']]);
        $request->user()->cart()->firstOrCreate()->update($data);

        return response()->json(['data' => $this->cart($request)]);
    }

    public function preview(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->summary($this->cart($request))]);
    }

    private function cart(Request $request)
    {
        return $request->user()->cart()->firstOrCreate()->load('items.product.producerProfile');
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
}
