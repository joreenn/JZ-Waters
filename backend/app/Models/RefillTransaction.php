<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RefillTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_id',
        'customer_name',
        'water_type',
        'gallons_count',
        'price_per_gallon',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'price_per_gallon' => 'decimal:2',
            'total' => 'decimal:2',
            'gallons_count' => 'integer',
        ];
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}
