<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentWebhookController extends Controller
{
    public function store(Request $request, string $provider): JsonResponse
    {
        DB::table('payment_webhook_events')->insert([
            'provider' => $provider,
            'event_type' => $request->input('type'),
            'external_id' => $request->input('id'),
            'payload' => json_encode($request->all()),
            'status' => 'received',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'data' => ['message' => 'Webhook recibido para procesamiento futuro.'],
        ]);
    }
}
