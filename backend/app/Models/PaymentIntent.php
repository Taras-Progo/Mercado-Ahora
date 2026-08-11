<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['order_id', 'buyer_id', 'internal_reference', 'idempotency_key', 'provider', 'mode', 'amount_cents', 'currency', 'status', 'external_id', 'preference_id', 'provider_payment_id', 'provider_status', 'provider_status_detail', 'checkout_url', 'sandbox_checkout_url', 'expires_at', 'reserved_at', 'paid_at', 'last_synced_at', 'requires_review', 'processing_error', 'payload'])]
class PaymentIntent extends Model
{
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'expires_at' => 'datetime',
            'reserved_at' => 'datetime',
            'paid_at' => 'datetime',
            'last_synced_at' => 'datetime',
            'requires_review' => 'boolean',
        ];
    }

    public function primaryOrder(): BelongsTo { return $this->belongsTo(Order::class, 'order_id'); }
    public function buyer(): BelongsTo { return $this->belongsTo(User::class, 'buyer_id'); }
    public function orders(): BelongsToMany { return $this->belongsToMany(Order::class, 'payment_intent_order')->withTimestamps(); }
    public function reservations(): HasMany { return $this->hasMany(StockReservation::class); }
    public function transactions(): HasMany { return $this->hasMany(PaymentTransaction::class); }
    public function statusHistory(): HasMany { return $this->hasMany(PaymentStatusHistory::class); }
}