<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RefillTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'staff_id'          => $this->staff_id,
            'staff'             => new UserResource($this->whenLoaded('staff')),
            'customer_name'     => $this->customer_name,
            'water_type'        => $this->water_type,
            'gallons_count'     => $this->gallons_count,
            'price_per_gallon'  => (float) $this->price_per_gallon,
            'total'             => (float) $this->total,
            'created_at'        => $this->created_at?->toISOString(),
        ];
    }
}
