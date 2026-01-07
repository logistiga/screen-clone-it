<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRepresentantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:50',
            'adresse' => 'nullable|string|max:500',
            'taux_commission' => 'nullable|numeric|min:0|max:100',
            'actif' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
            'taux_commission.min' => 'Le taux de commission ne peut pas être négatif.',
            'taux_commission.max' => 'Le taux de commission ne peut pas dépasser 100%.',
        ];
    }
}
