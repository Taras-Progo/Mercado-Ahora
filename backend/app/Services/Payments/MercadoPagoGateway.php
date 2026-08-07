<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Exceptions\PaymentGatewayException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class MercadoPagoGateway implements PaymentGateway
{
    public function createPreference(array $payload, string $idempotencyKey): array
    {
        $accessToken = (string) config('services.mercado_pago.access_token');

        if ($accessToken === '') {
            throw new PaymentGatewayException('Mercado Pago no está configurado en este entorno.');
        }

        try {
            $response = Http::baseUrl((string) config('services.mercado_pago.api_url'))
                ->acceptJson()
                ->asJson()
                ->withToken($accessToken)
                ->withHeaders(['X-Idempotency-Key' => $idempotencyKey])
                ->timeout((int) config('services.mercado_pago.timeout', 15))
                ->retry(2, 250, throw: false)
                ->post('/checkout/preferences', $payload);
        } catch (ConnectionException $exception) {
            throw new PaymentGatewayException('No pudimos conectar con Mercado Pago. Intentá nuevamente.', 0, $exception);
        }

        if (! $response->successful()) {
            report(new PaymentGatewayException("Mercado Pago preference error ({$response->status()})."));
            throw new PaymentGatewayException('Mercado Pago no pudo preparar el pago. Intentá nuevamente.');
        }

        $preference = $response->json();

        if (! is_array($preference) || empty($preference['id'])) {
            throw new PaymentGatewayException('Mercado Pago devolvió una respuesta incompleta.');
        }

        return $preference;
    }
}
