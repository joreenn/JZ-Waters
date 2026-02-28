<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                => ['required', 'string', 'max:255'],
            'category'            => ['required', 'in:water,other'],
            'description'         => ['nullable', 'string', 'max:1000'],
            'price'               => ['required', 'numeric', 'min:0.01'],
            'stock_quantity'      => ['required', 'integer', 'min:0'],
            'unit'                => ['required', 'string', 'max:50'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'image'               => ['nullable', 'image', 'max:2048'],
        ];
    }
}
