<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePrimeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'representant_id' => 'required|exists:representants,id',
            'facture_id' => 'nullable|exists:factures,id',
            'montant' => 'required|numeric|min:0.01|max:999999999.99',
            'description' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'representant_id.required' => 'Le représentant est obligatoire.',
            'representant_id.exists' => 'Le représentant sélectionné n\'existe pas.',
            'montant.required' => 'Le montant est obligatoire.',
            'montant.min' => 'Le montant doit être supérieur à 0.',
        ];
    }
}
