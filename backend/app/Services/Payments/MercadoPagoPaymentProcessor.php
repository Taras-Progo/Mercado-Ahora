<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentIntent;
use App\Models\PaymentStatusHistory;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Models\StockReservation;
use App\Notifications\PaidOrderReceivedNotification;
use App\Notifications\PaymentStatusNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MercadoPagoPaymentProcessor
{
    /** @return array<string, string> */
    public const PROVIDER_STATUS_MAP = [
        'approved' => 'approved',
        'pending' => 'pending',
        'in_process' => 'pending',
        'authorized' => 'pending',
        'in_mediation' => 'pending',
        'rejected' => 'rejected',
        'cancelled' => 'cancelled',
        'refunded' => 'requires_review',
        'charged_back' => 'requires_review',
    ];

    public function processProviderPayment(array $payment, string $source = 'webhook'): PaymentIntent
    {
        $reference = trim((string) ($payment['external_reference'] ?? ''));
        if ($reference === '') {
            throw ValidationException::withMessages(['payment' => 'El pago no tiene una referencia interna válida.']);
        }

        return DB::transaction(function () use ($payment, $reference, $source): PaymentIntent {
            $intent = PaymentIntent::query()
                ->where('internal_reference', $reference)
                ->lockForUpdate()
                ->first();

            if (! $intent || $intent->provider !== 'mercado_pago') {
                throw ValidationException::withMessages(['payment' => 'No encontramos el intento de pago asociado.']);
            }

            $providerPaymentId = (string) ($payment['id'] ?? '');
            $providerStatus = (string) ($payment['status'] ?? 'unknown');
            $normalized = self::PROVIDER_STATUS_MAP[$providerStatus] ?? 'requires_review';
            $currency = strtoupper((string) ($payment['currency_id'] ?? ''));
            $amountCents = (int) round(((float) ($payment['transaction_amount'] ?? 0)) * 100);
            $liveMode = (bool) ($payment['live_mode'] ?? false);
            $expectedLiveMode = $intent->mode === 'production';

            if ($providerPaymentId === ''
                || $currency !== $intent->currency
                || $amountCents !== (int) $intent->amount_cents
                || $liveMode !== $expectedLiveMode) {
                return $this->markForReview(
                    $intent,
                    $providerPaymentId ?: null,
                    $providerStatus,
                    'Los datos confirmados por Mercado Pago no coinciden con el intento local.',
                    $source,
                );
            }

            $existingTransaction = PaymentTransaction::query()
                ->where('provider', 'mercado_pago')
                ->where('external_id', $providerPaymentId)
                ->lockForUpdate()
                ->first();

            if ($existingTransaction && $existingTransaction->payment_intent_id !== $intent->id) {
                return $this->markForReview(
                    $intent,
                    $providerPaymentId,
                    $providerStatus,
                    'El identificador del pago ya está vinculado con otro intento.',
                    $source,
                );
            }

            $alreadyApproved = $intent->status === 'approved';
            $duplicateApprovedIntent = PaymentIntent::query()
                ->where('id', '!=', $intent->id)
                ->where('status', 'approved')
                ->whereHas('orders', fn ($query) => $query->whereIn('orders.id', $intent->orders()->pluck('orders.id')))
                ->lockForUpdate()
                ->exists();

            PaymentTransaction::query()->updateOrCreate(
                ['provider' => 'mercado_pago', 'external_id' => $providerPaymentId],
                [
                    'payment_intent_id' => $intent->id,
                    'amount_cents' => $amountCents,
                    'currency' => $currency,
                    'status' => $providerStatus,
                    'status_detail' => $payment['status_detail'] ?? null,
                    'payment_method_id' => $payment['payment_method_id'] ?? null,
                    'payment_type_id' => $payment['payment_type_id'] ?? null,
                    'live_mode' => $liveMode,
                    'provider_created_at' => $payment['date_created'] ?? null,
                    'provider_approved_at' => $payment['date_approved'] ?? null,
                    'payload' => [
                        'operation_type' => $payment['operation_type'] ?? null,
                        'installments' => $payment['installments'] ?? null,
                    ],
                ],
            );

            if ($alreadyApproved) {
                $intent->update(['last_synced_at' => now()]);
                return $intent->fresh();
            }

            if ($normalized === 'approved' && $duplicateApprovedIntent) {
                return $this->markForReview($intent, $providerPaymentId, $providerStatus, 'Ya existe otro pago aprobado para estos pedidos.', $source);
            }

            if ($normalized === 'approved') {
                return $this->approve($intent, $payment, $source);
            }

            if (in_array($normalized, ['rejected', 'cancelled'], true)) {
                return $this->release($intent, $normalized, $providerPaymentId, $providerStatus, $payment['status_detail'] ?? null, $source);
            }

            if ($normalized === 'pending') {
                return $this->transition($intent, 'pending', $providerPaymentId, $providerStatus, $payment['status_detail'] ?? null, $source);
            }

            return $this->markForReview($intent, $providerPaymentId, $providerStatus, 'Mercado Pago informó un estado que requiere revisión administrativa.', $source);
        }, 3);
    }

    public function expire(PaymentIntent $intent, string $source = 'scheduler'): PaymentIntent
    {
        return DB::transaction(function () use ($intent, $source): PaymentIntent {
            $locked = PaymentIntent::query()->lockForUpdate()->findOrFail($intent->id);
            if ($locked->status === 'approved') {
                return $locked;
            }

            return $this->release($locked, 'expired', $locked->provider_payment_id, $locked->provider_status, 'reservation_expired', $source);
        }, 3);
    }

    private function approve(PaymentIntent $intent, array $payment, string $source): PaymentIntent
    {
        $reservations = StockReservation::query()
            ->where('payment_intent_id', $intent->id)
            ->where('status', 'active')
            ->lockForUpdate()
            ->get();

        if ($reservations->isEmpty()) {
            return $this->markForReview(
                $intent,
                (string) $payment['id'],
                (string) $payment['status'],
                'El pago llegó después de que la reserva fuera liberada.',
                $source,
            );
        }

        $requiredByProduct = $reservations->groupBy('product_id')->map->sum('quantity');
        $products = Product::query()->whereIn('id', $requiredByProduct->keys())->orderBy('id')->lockForUpdate()->get()->keyBy('id');

        foreach ($requiredByProduct as $productId => $quantity) {
            $product = $products->get($productId);
            $reservedByOthers = StockReservation::query()
                ->where('product_id', $productId)
                ->where('payment_intent_id', '!=', $intent->id)
                ->where('status', 'active')
                ->where('expires_at', '>', now())
                ->sum('quantity');
            $available = max(0, (int) ($product?->stock ?? 0) - (int) $reservedByOthers);

            if (! $product || $product->status !== 'active' || $available < $quantity) {
                return $this->markForReview(
                    $intent,
                    (string) $payment['id'],
                    (string) $payment['status'],
                    'El pago fue aprobado, pero el stock reservado ya no está disponible.',
                    $source,
                );
            }
        }

        foreach ($requiredByProduct as $productId => $quantity) {
            $products->get($productId)->decrement('stock', $quantity);
        }

        $reservations->each->update(['status' => 'consumed', 'consumed_at' => now()]);
        $intent = $this->transition(
            $intent,
            'approved',
            (string) $payment['id'],
            (string) $payment['status'],
            $payment['status_detail'] ?? null,
            $source,
            ['paid_at' => $payment['date_approved'] ?? now(), 'requires_review' => false, 'processing_error' => null],
        );

        $orders = $intent->orders()->with('items.producerProfile.user')->lockForUpdate()->get();
        foreach ($orders as $order) {
            $order->update(['status' => 'confirmed', 'payment_status' => 'approved']);
            $order->statusHistory()->firstOrCreate(
                ['status' => 'confirmed', 'note' => 'Pago aprobado y validado por Mercado Pago.'],
                ['changed_by' => null],
            );
        }

        DB::afterCommit(function () use ($intent, $orders): void {
            $intent->buyer?->notify(new PaymentStatusNotification($intent->id, 'approved'));
            foreach ($orders as $order) {
                $producer = $order->items->first()?->producerProfile?->user;
                $producer?->notify(new PaidOrderReceivedNotification($order->id));
            }
        });

        return $intent->fresh();
    }

    private function release(
        PaymentIntent $intent,
        string $status,
        ?string $providerPaymentId,
        ?string $providerStatus,
        ?string $detail,
        string $source,
    ): PaymentIntent {
        $intent->reservations()->where('status', 'active')->update(['status' => 'released', 'released_at' => now()]);
        $intent = $this->transition($intent, $status, $providerPaymentId, $providerStatus, $detail, $source);

        foreach ($intent->orders()->lockForUpdate()->get() as $order) {
            $order->update(['status' => 'cancelled', 'payment_status' => $status]);
            $order->statusHistory()->firstOrCreate(
                ['status' => 'cancelled', 'note' => 'El pago no se completó y la reserva de stock fue liberada.'],
                ['changed_by' => null],
            );
        }

        return $intent->fresh();
    }

    private function markForReview(
        PaymentIntent $intent,
        ?string $providerPaymentId,
        ?string $providerStatus,
        string $reason,
        string $source,
    ): PaymentIntent {
        $intent = $this->transition(
            $intent,
            'requires_review',
            $providerPaymentId,
            $providerStatus,
            null,
            $source,
            ['requires_review' => true, 'processing_error' => $reason],
        );
        $intent->orders()->update(['payment_status' => 'requires_review']);

        return $intent->fresh();
    }

    private function transition(
        PaymentIntent $intent,
        string $status,
        ?string $providerPaymentId,
        ?string $providerStatus,
        ?string $providerStatusDetail,
        string $source,
        array $extra = [],
    ): PaymentIntent {
        $from = $intent->status;
        $history = PaymentStatusHistory::query()->firstOrCreate(
            ['payment_intent_id' => $intent->id, 'to_status' => $status],
            [
                'from_status' => $from,
                'source' => $source,
                'provider_payment_id' => $providerPaymentId,
                'metadata' => ['provider_status' => $providerStatus, 'status_detail' => $providerStatusDetail],
            ],
        );

        $intent->update(array_merge([
            'status' => $status,
            'provider_payment_id' => $providerPaymentId ?: $intent->provider_payment_id,
            'provider_status' => $providerStatus,
            'provider_status_detail' => $providerStatusDetail,
            'last_synced_at' => now(),
        ], $extra));

        if ($status === 'pending') {
            $intent->orders()->update(['payment_status' => 'pending']);
        }

        if ($history->wasRecentlyCreated && in_array($status, ['pending', 'rejected', 'cancelled', 'expired'], true)) {
            DB::afterCommit(fn () => $intent->buyer?->notify(new PaymentStatusNotification($intent->id, $status)));
        }

        return $intent->fresh();
    }
}