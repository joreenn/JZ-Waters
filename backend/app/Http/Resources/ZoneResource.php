<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'delivery_fee' => (float) $this->delivery_fee,
            'is_active'    => (bool) $this->is_active,
        ];
    }
}
