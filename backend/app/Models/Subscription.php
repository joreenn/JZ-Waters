<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'product_id',
        'quantity',
        'zone_id',
        'delivery_address',
        'frequency_days',
        'next_delivery_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'next_delivery_date' => 'date',
            'is_active' => 'boolean',
            'quantity' => 'integer',
            'frequency_days' => 'integer',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }
}
