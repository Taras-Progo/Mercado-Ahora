<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['payment_intent_id', 'provider', 'external_id', 'amount_cents', 'currency', 'status', 'status_detail', 'payment_method_id', 'payment_type_id', 'live_mode', 'provider_created_at', 'provider_approved_at', 'payload'])]
class PaymentTransaction extends Model
{
    protected function casts(): array
    {
        return [
            'live_mode' => 'boolean',
            'provider_created_at' => 'datetime',
            'provider_approved_at' => 'datetime',
            'payload' => 'array',
        ];
    }

    public function paymentIntent(): BelongsTo
    {
        return $this->belongsTo(PaymentIntent::class);
    }
}