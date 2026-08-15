<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentIntent;
use App\Models\Product;
use App\Services\Payments\MercadoPagoCheckoutService;
use App\Services\Payments\MercadoPagoPaymentReconciler;
use App\Services\Payments\PaymentSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MercadoPagoCheckoutController extends Controller
{
    public function store(Request $request, MercadoPagoCheckoutService $checkout): JsonResponse
    {
        $isBuyNow = $request->filled('product_id');
        $needsDeliveryAddress = in_array($request->input('delivery_type'), ['home_delivery', 'pickup_point'], true);

        $data = $request->validate([
            'idempotency_key' => ['required', 'uuid'],
            'product_id' => ['nullable', 'required_with:quantity', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'required_with:product_id', 'integer', 'min:1'],
            'delivery_type' => [Rule::requiredIf($isBuyNow), 'nullable', Rule::in(['home_delivery', 'pickup_point', 'producer_pickup', 'local'])],
            'delivery_address' => [Rule::requiredIf($isBuyNow && $needsDeliveryAddress), 'nullable', 'string', 'max:255'],
            'city' => [Rule::requiredIf($isBuyNow && $needsDeliveryAddress), 'nullable', 'string', 'max:120'],
            'province' => [Rule::requiredIf($isBuyNow && $needsDeliveryAddress), 'nullable', 'string', 'max:120'],
            'buyer_note' => ['nullable', 'string', 'max:1000'],
        ], [
            'delivery_type.required' => "Seleccion\u{00e1} c\u{00f3}mo quer\u{00e9}s recibir el producto.",
            'delivery_type.in' => "La forma de entrega seleccionada no es v\u{00e1}lida.",
            'delivery_address.required' => "Complet\u{00e1} la direcci\u{00f3}n de entrega.",
            'city.required' => "Complet\u{00e1} la ciudad de entrega.",
            'province.required' => "Complet\u{00e1} la provincia de entrega.",
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

    public function show(
        Request $request,
        string $reference,
        PaymentSummaryService $summary,
        MercadoPagoPaymentReconciler $reconciler,
    ): JsonResponse
    {
        $intent = PaymentIntent::query()
            ->with('orders:id,order_number,status,payment_status,total_cents')
            ->where('internal_reference', $reference)
            ->where('buyer_id', $request->user()->id)
            ->firstOrFail();

        if ($reconciler->shouldSync($intent)) {
            try {
                $intent = $reconciler->sync($intent, 'buyer_status_poll')->load(
                    'orders:id,order_number,status,payment_status,total_cents',
                );
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

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