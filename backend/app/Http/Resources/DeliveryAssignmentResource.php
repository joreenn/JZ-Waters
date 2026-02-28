<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'order_id'            => $this->order_id,
            'order'               => new OrderResource($this->whenLoaded('order')),
            'delivery_staff_id'   => $this->delivery_staff_id,
            'delivery_staff'      => new UserResource($this->whenLoaded('deliveryStaff')),
            'status'              => $this->status,
            'cancellation_reason' => $this->cancellation_reason,
            'created_at'          => $this->created_at?->toISOString(),
            'updated_at'          => $this->updated_at?->toISOString(),
        ];
    }
}
