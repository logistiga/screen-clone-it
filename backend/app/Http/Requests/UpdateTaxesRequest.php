<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaxesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'taux_tva' => 'required|numeric|min:0|max:100',
            'taux_css' => 'required|numeric|min:0|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'taux_tva.required' => 'Le taux de TVA est obligatoire.',
            'taux_tva.min' => 'Le taux de TVA ne peut pas être négatif.',
            'taux_tva.max' => 'Le taux de TVA ne peut pas dépasser 100%.',
            'taux_css.required' => 'Le taux de CSS est obligatoire.',
            'taux_css.min' => 'Le taux de CSS ne peut pas être négatif.',
            'taux_css.max' => 'Le taux de CSS ne peut pas dépasser 100%.',
        ];
    }
}
