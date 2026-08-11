<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['payment_intent_id', 'from_status', 'to_status', 'source', 'provider_payment_id', 'metadata'])]
class PaymentStatusHistory extends Model
{
    protected function casts(): array
    {
        return ['metadata' => 'array'];
    }

    public function paymentIntent(): BelongsTo
    {
        return $this->belongsTo(PaymentIntent::class);
    }
}