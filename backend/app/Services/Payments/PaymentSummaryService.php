<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentIntent;
use Illuminate\Support\Collection;

class PaymentSummaryService
{
    /** @return array<string, mixed>|null */
    public function forOrder(Order $order): ?array
    {
        $intents = $order->relationLoaded('paymentIntents')
            ? $order->paymentIntents
            : $order->paymentIntents()->latest('payment_intents.id')->get();

        $intent = $intents->firstWhere('status', 'approved')
            ?? $intents->sortByDesc('id')->first();

        return $intent ? $this->forIntent($intent) : null;
    }

    /** @return array<string, mixed> */
    public function forIntent(PaymentIntent $intent): array
    {
        return [
            'provider' => $intent->provider,
            'reference' => $intent->internal_reference,
            'status' => $intent->status,
            'amount_cents' => (int) $intent->amount_cents,
            'currency' => $intent->currency,
            'approved_at' => $intent->paid_at?->toIso8601String(),
            'expires_at' => $intent->expires_at?->toIso8601String(),
            'last_synced_at' => $intent->last_synced_at?->toIso8601String(),
            'requires_review' => (bool) $intent->requires_review,
            'retry_allowed' => $intent->provider === 'mercado_pago'
                && in_array($intent->status, ['rejected', 'cancelled', 'expired', 'failed'], true),
        ];
    }

    public function attachToOrders(Collection $orders): Collection
    {
        return $orders->each(fn (Order $order) => $order->setAttribute('payment_summary', $this->forOrder($order)));
    }
}