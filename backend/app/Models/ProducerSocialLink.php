<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['producer_profile_id', 'platform', 'url', 'is_visible'])]
class ProducerSocialLink extends Model
{
    protected function casts(): array
    {
        return ['is_visible' => 'boolean'];
    }

    public function producerProfile(): BelongsTo
    {
        return $this->belongsTo(ProducerProfile::class);
    }
}
