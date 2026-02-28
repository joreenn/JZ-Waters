<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'title'        => $this->title,
            'message'      => $this->message,
            'type'         => $this->type,
            'is_read'      => (bool) $this->is_read,
            'reference_id' => $this->reference_id,
            'created_at'   => $this->created_at?->toISOString(),
        ];
    }
}
