<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'name'                => $this->name,
            'category'            => $this->category,
            'description'         => $this->description,
            'price'               => (float) $this->price,
            'stock_quantity'      => $this->stock_quantity,
            'unit'                => $this->unit,
            'low_stock_threshold' => $this->low_stock_threshold,
            'image_path'          => $this->image_path ? asset('storage/' . $this->image_path) : null,
            'is_active'           => $this->is_active,
            'is_low_stock'        => $this->isLowStock(),
            'created_at'          => $this->created_at?->toISOString(),
        ];
    }
}
