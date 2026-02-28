<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'customer_id'         => $this->customer_id,
            'customer'            => new UserResource($this->whenLoaded('customer')),
            'product_id'          => $this->product_id,
            'product'             => new ProductResource($this->whenLoaded('product')),
            'quantity'            => $this->quantity,
            'zone_id'             => $this->zone_id,
            'zone'                => new ZoneResource($this->whenLoaded('zone')),
            'frequency_days'      => $this->frequency_days,
            'next_delivery_date'  => $this->next_delivery_date,
            'is_active'           => (bool) $this->is_active,
            'created_at'          => $this->created_at?->toISOString(),
        ];
    }
}
