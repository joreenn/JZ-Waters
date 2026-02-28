<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'customer_id'      => $this->customer_id,
            'customer'         => new UserResource($this->whenLoaded('customer')),
            'status'           => $this->status,
            'payment_method'   => $this->payment_method,
            'payment_status'   => $this->payment_status,
            'zone'             => new ZoneResource($this->whenLoaded('zone')),
            'delivery_address' => $this->delivery_address,
            'preferred_time'   => $this->preferred_time,
            'notes'            => $this->notes,
            'delivery_fee'     => (float) $this->delivery_fee,
            'subtotal'         => (float) $this->subtotal,
            'total_amount'     => (float) $this->total_amount,
            'items'            => OrderItemResource::collection($this->whenLoaded('items')),
            'delivery'         => new DeliveryAssignmentResource($this->whenLoaded('deliveryAssignment')),
            'created_at'       => $this->created_at?->toISOString(),
            'updated_at'       => $this->updated_at?->toISOString(),
        ];
    }
}
