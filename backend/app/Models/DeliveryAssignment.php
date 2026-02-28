<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'delivery_staff_id',
        'status',
        'cancellation_reason',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function deliveryStaff()
    {
        return $this->belongsTo(User::class, 'delivery_staff_id');
    }
}
