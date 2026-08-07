<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['buyer_id', 'order_number', 'status', 'payment_status', 'delivery_type', 'delivery_address', 'city', 'province', 'subtotal_cents', 'delivery_cents', 'total_cents', 'buyer_note'])]
class Order extends Model
{
    public function buyer(): BelongsTo { return $this->belongsTo(User::class, 'buyer_id'); }
    public function items(): HasMany { return $this->hasMany(OrderItem::class); }
    public function statusHistory(): HasMany { return $this->hasMany(OrderStatusHistory::class); }
    public function conversations(): HasMany { return $this->hasMany(Conversation::class); }
    public function returnRequests(): HasMany { return $this->hasMany(ReturnRequest::class); }
    public function paymentIntents(): BelongsToMany { return $this->belongsToMany(PaymentIntent::class, 'payment_intent_order')->withTimestamps(); }
    public function stockReservations(): HasMany { return $this->hasMany(StockReservation::class); }
}
