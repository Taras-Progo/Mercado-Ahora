<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['order_id', 'changed_by', 'status', 'note'])]
class OrderStatusHistory extends Model
{
}
