<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentIntent;
use App\Models\Product;
use App\Services\Payments\MercadoPagoCheckoutService;
use App\Services\Payments\PaymentSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MercadoPagoCheckoutController extends Controller
{
    public function store(Request $request, MercadoPagoCheckoutService $checkout): JsonResponse
    {
        $data = $request->validate([
            'idempotency_key' => ['required', 'uuid'],
            'product_id' => ['nullable', 'required_with:quantity', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'required_with:product_id', 'integer', 'min:1'],
            'delivery_type' => ['nullable', 'string', 'max:120'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'province' => ['nullable', 'string', 'max:120'],
            'buyer_note' => ['nullable', 'string'],
        ]);

        if (isset($data['product_id'])) {
            $product = Product::query()->findOrFail($data['product_id']);

            return response()->json([
                'data' => $checkout->startBuyNow(
                    $request->user(),
                    $product,
                    (int) $data['quantity'],
                    $data,
                ),
            ], 201);
        }

        $cart = $request->user()->cart()->firstOrCreate();

        return response()->json(['data' => $checkout->start($request->user(), $cart, $data)], 201);
    }

    public function show(Request $request, string $reference, PaymentSummaryService $summary): JsonResponse
    {
        $intent = PaymentIntent::query()
            ->with('orders:id,order_number,status,payment_status,total_cents')
            ->where('internal_reference', $reference)
            ->where('buyer_id', $request->user()->id)
            ->firstOrFail();

        return response()->json([
            'data' => [
                ...$summary->forIntent($intent),
                'orders' => $intent->orders->map->only(['id', 'order_number', 'status', 'payment_status', 'total_cents'])->values(),
            ],
        ]);
    }

    public function retry(
        Request $request,
        string $reference,
        MercadoPagoCheckoutService $checkout,
    ): JsonResponse {
        $data = $request->validate(['idempotency_key' => ['nullable', 'uuid']]);
        $intent = PaymentIntent::query()
            ->where('internal_reference', $reference)
            ->where('buyer_id', $request->user()->id)
            ->firstOrFail();

        return response()->json([
            'data' => $checkout->retry(
                $request->user(),
                $intent,
                $data['idempotency_key'] ?? (string) Str::uuid(),
            ),
        ], 201);
    }
}