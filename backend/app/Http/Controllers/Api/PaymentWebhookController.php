<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessMercadoPagoWebhook;
use App\Models\PaymentWebhookEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use MercadoPago\Exceptions\InvalidWebhookSignatureException;
use MercadoPago\Webhook\WebhookSignatureValidator;

class PaymentWebhookController extends Controller
{
    public function store(Request $request, string $provider): JsonResponse
    {
        if (! in_array(str_replace('_', '-', strtolower($provider)), ['mercado-pago'], true)) {
            return response()->json(['message' => 'Proveedor de pago no compatible.'], 404);
        }

        $secret = (string) config('services.mercado_pago.webhook_secret');
        if ($secret === '') {
            report(new \RuntimeException('MERCADO_PAGO_WEBHOOK_SECRET is not configured.'));
            return response()->json(['message' => 'Webhook no configurado.'], 503);
        }

        $dataId = (string) (
            $request->query('data.id')
            ?: $request->query('data_id')
            ?: $request->input('data.id')
            ?: ''
        );
        $requestId = (string) $request->header('x-request-id', '');

        try {
            WebhookSignatureValidator::validate(
                $request->header('x-signature'),
                $requestId ?: null,
                $dataId ?: null,
                $secret,
                (int) config('services.mercado_pago.webhook_tolerance_seconds', 300),
            );
        } catch (InvalidWebhookSignatureException|\InvalidArgumentException $exception) {
            report($exception);
            return response()->json(['message' => 'Firma de webhook inválida.'], 401);
        }

        if ($dataId === '') {
            return response()->json(['message' => 'El webhook no identifica un pago.'], 422);
        }

        $eventType = (string) ($request->input('type') ?: $request->input('action') ?: 'payment');
        $eventId = (string) ($request->input('id') ?: hash('sha256', $requestId.'|'.$eventType.'|'.$dataId));

        $event = PaymentWebhookEvent::query()->firstOrCreate(
            ['provider' => 'mercado_pago', 'external_id' => $eventId],
            [
                'event_type' => $eventType,
                'request_id' => $requestId ?: null,
                'resource_id' => $dataId,
                'signature_valid' => true,
                'payload' => [
                    'type' => $request->input('type'),
                    'action' => $request->input('action'),
                    'live_mode' => $request->boolean('live_mode'),
                    'resource_id' => $dataId,
                ],
                'status' => str_contains(strtolower($eventType), 'payment') ? 'received' : 'ignored',
            ],
        );

        if (! $event->wasRecentlyCreated) {
            return response()->json(['data' => ['message' => 'Webhook ya recibido.']]);
        }

        if ($event->status === 'received') {
            ProcessMercadoPagoWebhook::dispatch($event->id)->afterCommit();
        }

        return response()->json(['data' => ['message' => 'Webhook recibido.']]);
    }
}