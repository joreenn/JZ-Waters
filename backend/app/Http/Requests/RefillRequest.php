<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RefillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name'    => ['nullable', 'string', 'max:255'],
            'water_type'       => ['required', 'in:purified,alkaline,mineral'],
            'gallons_count'    => ['required', 'integer', 'min:1'],
            'price_per_gallon' => ['required', 'numeric', 'min:0.01'],
        ];
    }
}
