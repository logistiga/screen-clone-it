<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMouvementCaisseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:Entrée,Sortie',
            'source' => 'required|in:caisse,banque',
            'categorie' => 'required|string|max:100',
            'montant' => 'required|numeric|min:0.01|max:999999999.99',
            'description' => 'required|string|max:500',
            'beneficiaire' => 'nullable|string|max:255',
            'banque_id' => 'nullable|exists:banques,id',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Le type de mouvement est obligatoire.',
            'type.in' => 'Le type doit être Entrée ou Sortie.',
            'categorie.required' => 'La catégorie est obligatoire.',
            'montant.required' => 'Le montant est obligatoire.',
            'montant.min' => 'Le montant doit être supérieur à 0.',
            'description.required' => 'La description est obligatoire.',
        ];
    }
}
