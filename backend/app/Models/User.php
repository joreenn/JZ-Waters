<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
        'role',
        'points_balance',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'points_balance' => 'integer',
        ];
    }

    /* ── Relationships ── */

    public function orders()
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function deliveryAssignments()
    {
        return $this->hasMany(DeliveryAssignment::class, 'delivery_staff_id');
    }

    public function refillTransactions()
    {
        return $this->hasMany(RefillTransaction::class, 'staff_id');
    }

    public function loyaltyLogs()
    {
        return $this->hasMany(LoyaltyPointLog::class, 'customer_id');
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'customer_id');
    }

    public function customNotifications()
    {
        return $this->hasMany(Notification::class, 'user_id');
    }
}
