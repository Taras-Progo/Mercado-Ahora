<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['provider', 'event_type', 'external_id', 'request_id', 'resource_id', 'signature_valid', 'payload', 'status', 'attempts', 'processed_at', 'processing_error'])]
class PaymentWebhookEvent extends Model
{
    protected function casts(): array
    {
        return ['signature_valid' => 'boolean', 'payload' => 'array', 'processed_at' => 'datetime'];
    }
}