<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyPointLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'points_change',
        'reason',
        'reference_id',
    ];

    protected function casts(): array
    {
        return [
            'points_change' => 'integer',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
}
