<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['order_id', 'buyer_id', 'reason', 'details', 'status'])]
class ReturnRequest extends Model
{
}
