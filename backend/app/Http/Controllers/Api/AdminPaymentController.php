<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\PaymentIntent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', Rule::in([
                'pending', 'approved', 'rejected', 'cancelled', 'expired', 'requires_review', 'failed',
            ])],
            'requires_review' => ['nullable', 'boolean'],
        ]);

        $query = PaymentIntent::query()
            ->where('provider', 'mercado_pago')
            ->with(['buyer:id,name,email', 'orders:id,order_number,status,payment_status,total_cents'])
            ->withCount(['transactions', 'webhookEvents', 'reviewNotes'])
            ->latest('id');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (array_key_exists('requires_review', $filters)) {
            $query->where('requires_review', (bool) $filters['requires_review']);
        }
        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('internal_reference', 'like', "%{$search}%")
                    ->orWhere('preference_id', 'like', "%{$search}%")
                    ->orWhere('provider_payment_id', 'like', "%{$search}%")
                    ->orWhereHas('buyer', fn (Builder $buyer) => $buyer
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('orders', fn (Builder $orders) => $orders
                        ->where('order_number', 'like', "%{$search}%"));
            });
        }

        return response()->json([
            'data' => $query->limit(200)->get()->map(fn (PaymentIntent $intent) => $this->summary($intent)),
        ]);
    }

    public function show(PaymentIntent $paymentIntent): JsonResponse
    {
        abort_unless($paymentIntent->provider === 'mercado_pago', 404);

        $paymentIntent->loadCount(['transactions', 'webhookEvents', 'reviewNotes']);

        $paymentIntent->load([
            'buyer:id,name,email',
            'orders:id,order_number,status,payment_status,total_cents,created_at',
            'transactions' => fn ($query) => $query->latest('id'),
            'statusHistory' => fn ($query) => $query->orderBy('id'),
            'webhookEvents' => fn ($query) => $query->latest('id'),
            'reviewNotes' => fn ($query) => $query->with('admin:id,name,email')->latest('id'),
        ]);

        return response()->json(['data' => $this->detail($paymentIntent)]);
    }

    public function storeReviewNote(Request $request, PaymentIntent $paymentIntent): JsonResponse
    {
        abort_unless($paymentIntent->provider === 'mercado_pago', 404);
        $data = $request->validate(['note' => ['required', 'string', 'min:3', 'max:3000']]);

        $note = $paymentIntent->reviewNotes()->create([
            'admin_id' => $request->user()->id,
            'note' => trim($data['note']),
        ]);

        AdminAuditLog::query()->create([
            'admin_id' => $request->user()->id,
            'action' => 'admin.payment.review_note_added',
            'subject_type' => PaymentIntent::class,
            'subject_id' => $paymentIntent->id,
            'metadata' => ['reference' => $paymentIntent->internal_reference],
        ]);

        return response()->json(['data' => $note->load('admin:id,name,email')], 201);
    }

    /** @return array<string, mixed> */
    private function summary(PaymentIntent $intent): array
    {
        return [
            'id' => $intent->id,
            'reference' => $intent->internal_reference,
            'provider' => $intent->provider,
            'mode' => $intent->mode,
            'status' => $intent->status,
            'provider_status' => $intent->provider_status,
            'amount_cents' => (int) $intent->amount_cents,
            'currency' => $intent->currency,
            'preference_id' => $intent->preference_id,
            'provider_payment_id' => $intent->provider_payment_id,
            'requires_review' => (bool) $intent->requires_review,
            'processing_error' => $intent->processing_error,
            'expires_at' => $intent->expires_at?->toIso8601String(),
            'approved_at' => $intent->paid_at?->toIso8601String(),
            'last_synced_at' => $intent->last_synced_at?->toIso8601String(),
            'created_at' => $intent->created_at?->toIso8601String(),
            'buyer' => $intent->buyer,
            'orders' => $intent->orders,
            'transactions_count' => (int) ($intent->transactions_count ?? 0),
            'webhook_events_count' => (int) ($intent->webhook_events_count ?? 0),
            'review_notes_count' => (int) ($intent->review_notes_count ?? 0),
        ];
    }

    /** @return array<string, mixed> */
    private function detail(PaymentIntent $intent): array
    {
        return array_merge($this->summary($intent), [
            'provider_status_detail' => $intent->provider_status_detail,
            'transactions' => $intent->transactions->map(fn ($transaction) => [
                'id' => $transaction->id,
                'external_id' => $transaction->external_id,
                'status' => $transaction->status,
                'status_detail' => $transaction->status_detail,
                'amount_cents' => (int) $transaction->amount_cents,
                'currency' => $transaction->currency,
                'payment_method_id' => $transaction->payment_method_id,
                'payment_type_id' => $transaction->payment_type_id,
                'live_mode' => $transaction->live_mode,
                'provider_created_at' => $transaction->provider_created_at?->toIso8601String(),
                'provider_approved_at' => $transaction->provider_approved_at?->toIso8601String(),
                'created_at' => $transaction->created_at?->toIso8601String(),
            ]),
            'status_history' => $intent->statusHistory->map(fn ($entry) => [
                'id' => $entry->id,
                'from_status' => $entry->from_status,
                'to_status' => $entry->to_status,
                'source' => $entry->source,
                'provider_payment_id' => $entry->provider_payment_id,
                'created_at' => $entry->created_at?->toIso8601String(),
            ]),
            'webhook_events' => $intent->webhookEvents->map(fn ($event) => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'external_id' => $event->external_id,
                'resource_id' => $event->resource_id,
                'signature_valid' => (bool) $event->signature_valid,
                'status' => $event->status,
                'attempts' => (int) $event->attempts,
                'processed_at' => $event->processed_at?->toIso8601String(),
                'created_at' => $event->created_at?->toIso8601String(),
            ]),
            'review_notes' => $intent->reviewNotes,
        ]);
    }
}
