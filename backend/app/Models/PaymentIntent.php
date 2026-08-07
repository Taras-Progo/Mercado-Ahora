<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['order_id', 'buyer_id', 'internal_reference', 'idempotency_key', 'provider', 'mode', 'amount_cents', 'currency', 'status', 'external_id', 'preference_id', 'checkout_url', 'sandbox_checkout_url', 'expires_at', 'reserved_at', 'payload'])]
class PaymentIntent extends Model
{
    protected function casts(): array
    {
        return ['payload' => 'array', 'expires_at' => 'datetime', 'reserved_at' => 'datetime'];
    }

    public function primaryOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'payment_intent_order')->withTimestamps();
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(StockReservation::class);
    }
}
