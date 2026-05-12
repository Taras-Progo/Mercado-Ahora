<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'business_name', 'slug', 'province', 'city', 'description', 'production_practices', 'production_origin', 'product_types', 'production_method', 'production_since', 'story', 'digital_presence_notes', 'status', 'approved_by', 'approved_at', 'approval_notes', 'rejection_reason', 'logo_path'])]
class ProducerProfile extends Model
{
    protected function casts(): array
    {
        return ['approved_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function socialLinks(): HasMany
    {
        return $this->hasMany(ProducerSocialLink::class);
    }
}
