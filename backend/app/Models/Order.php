<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'status',
        'payment_method',
        'payment_status',
        'zone_id',
        'delivery_address',
        'preferred_time',
        'notes',
        'delivery_fee',
        'subtotal',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'delivery_fee' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function deliveryAssignment()
    {
        return $this->hasOne(DeliveryAssignment::class);
    }
}
