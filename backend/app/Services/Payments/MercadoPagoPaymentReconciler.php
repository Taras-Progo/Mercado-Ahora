<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Models\PaymentIntent;

class MercadoPagoPaymentReconciler
{
    private const OPEN_STATUSES = ['creating', 'preference_created', 'pending'];

    public function __construct(
        private readonly PaymentGateway $gateway,
        private readonly MercadoPagoPaymentProcessor $processor,
    ) {
    }

    public function shouldSync(PaymentIntent $intent, int $minimumAgeSeconds = 10): bool
    {
        return $intent->provider === 'mercado_pago'
            && in_array($intent->status, self::OPEN_STATUSES, true)
            && (! $intent->last_synced_at || $intent->last_synced_at->lte(now()->subSeconds($minimumAgeSeconds)));
    }

    public function sync(PaymentIntent $intent, string $source = 'reconciliation'): PaymentIntent
    {
        if (! in_array($intent->status, self::OPEN_STATUSES, true)) {
            return $intent->fresh();
        }

        $payments = collect($this->gateway->searchPaymentsByExternalReference(
            (string) $intent->internal_reference,
        ));

        $payment = $payments->first(fn (array $candidate) => ($candidate['status'] ?? null) === 'approved')
            ?? $payments->first();

        if (! is_array($payment)) {
            $intent->update(['last_synced_at' => now()]);

            return $intent->fresh();
        }

        return $this->processor->processProviderPayment($payment, $source);
    }
}
