<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'address'        => $this->address,
            'role'           => $this->role,
            'points_balance' => $this->points_balance,
            'created_at'     => $this->created_at?->toISOString(),
            'orders_count'   => $this->when($this->orders_count !== null, $this->orders_count),
        ];
    }
}
