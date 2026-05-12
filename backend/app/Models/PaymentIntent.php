<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['order_id', 'provider', 'amount_cents', 'currency', 'status', 'external_id', 'payload'])]
class PaymentIntent extends Model
{
    protected function casts(): array
    {
        return ['payload' => 'array'];
    }
}
