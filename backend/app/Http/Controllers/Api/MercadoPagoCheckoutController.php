<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Payments\MercadoPagoCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MercadoPagoCheckoutController extends Controller
{
    public function store(Request $request, MercadoPagoCheckoutService $checkout): JsonResponse
    {
        $data = $request->validate([
            'idempotency_key' => ['required', 'uuid'],
            'delivery_type' => ['nullable', 'string', 'max:120'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'province' => ['nullable', 'string', 'max:120'],
            'buyer_note' => ['nullable', 'string'],
        ]);

        $cart = $request->user()->cart()->firstOrCreate();

        return response()->json([
            'data' => $checkout->start($request->user(), $cart, $data),
        ], 201);
    }
}
