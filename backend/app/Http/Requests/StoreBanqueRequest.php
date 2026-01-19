<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBanqueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'numero_compte' => 'required|string|max:100',
            'rib' => 'nullable|string|max:100',
            'iban' => 'nullable|string|max:50',
            'swift' => 'nullable|string|max:20',
            'solde' => 'nullable|numeric|min:0',
            'actif' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de la banque est obligatoire.',
            'nom.max' => 'Le nom ne peut pas dépasser 255 caractères.',
            'numero_compte.required' => 'Le numéro de compte est obligatoire.',
            'numero_compte.max' => 'Le numéro de compte ne peut pas dépasser 100 caractères.',
        ];
    }
}
