<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items'                => ['required', 'array', 'min:1'],
            'items.*.product_id'   => ['required', 'exists:products,id'],
            'items.*.quantity'     => ['required', 'integer', 'min:1'],
            'zone_id'             => ['required', 'exists:zones,id'],
            'delivery_address'    => ['required', 'string', 'max:500'],
            'preferred_time'      => ['nullable', 'string', 'max:100'],
            'payment_method'      => ['required', 'in:cod,gcash'],
            'notes'               => ['nullable', 'string', 'max:1000'],
        ];
    }
}
