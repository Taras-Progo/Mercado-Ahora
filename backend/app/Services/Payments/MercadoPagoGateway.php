<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Exceptions\PaymentGatewayException;
use App\Exceptions\PaymentResourceNotFoundException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class MercadoPagoGateway implements PaymentGateway
{
    public function createPreference(array $payload, string $idempotencyKey): array
    {
        $accessToken = $this->accessToken();

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

    public function getPayment(string $paymentId): array
    {
        return $this->getJson('/v1/payments/'.rawurlencode($paymentId), 'consultar el pago');
    }

    public function searchPaymentsByExternalReference(string $reference): array
    {
        $response = $this->getJson('/v1/payments/search', 'buscar el pago', [
            'external_reference' => $reference,
            'sort' => 'date_created',
            'criteria' => 'desc',
        ]);

        return is_array($response['results'] ?? null) ? $response['results'] : [];
    }

    /** @return array<string, mixed> */
    private function getJson(string $path, string $operation, array $query = []): array
    {
        try {
            $response = Http::baseUrl((string) config('services.mercado_pago.api_url'))
                ->acceptJson()
                ->withToken($this->accessToken())
                ->timeout((int) config('services.mercado_pago.timeout', 15))
                ->retry(2, 250, throw: false)
                ->get($path, $query);
        } catch (ConnectionException $exception) {
            throw new PaymentGatewayException('No pudimos conectar con Mercado Pago. Intentá nuevamente.', 0, $exception);
        }

        if ($response->notFound()) {
            throw new PaymentResourceNotFoundException('Mercado Pago no encontró el recurso solicitado.');
        }

        if (! $response->successful() || ! is_array($response->json())) {
            report(new PaymentGatewayException("Mercado Pago no pudo {$operation} ({$response->status()})."));
            throw new PaymentGatewayException("Mercado Pago no pudo {$operation}.");
        }

        return $response->json();
    }

    private function accessToken(): string
    {
        $accessToken = (string) config('services.mercado_pago.access_token');
        if ($accessToken === '') {
            throw new PaymentGatewayException('Mercado Pago no está configurado en este entorno.');
        }

        return $accessToken;
    }
}
