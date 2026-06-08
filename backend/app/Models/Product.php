<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['producer_profile_id', 'category_id', 'name', 'slug', 'description', 'price_cents', 'currency', 'stock', 'unit', 'province', 'city', 'production_type', 'delivery_type', 'ecoscore_points', 'ecoscore_notes', 'ecoscore_status', 'ecoscore_validated_by', 'ecoscore_validated_at', 'ecoscore_validation_notes', 'status'])]
class Product extends Model
{
    protected function casts(): array
    {
        return ['ecoscore_validated_at' => 'datetime'];
    }

    public function producerProfile(): BelongsTo
    {
        return $this->belongsTo(ProducerProfile::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
