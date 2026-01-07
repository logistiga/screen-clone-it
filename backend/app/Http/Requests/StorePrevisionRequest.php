<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePrevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:Recette,Dépense',
            'categorie' => 'required|string|max:100',
            'description' => 'required|string|max:500',
            'montant_prevu' => 'required|numeric|min:0|max:999999999.99',
            'mois' => 'required|integer|min:1|max:12',
            'annee' => 'required|integer|min:2020|max:2100',
            'date_prevue' => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Le type est obligatoire.',
            'type.in' => 'Le type doit être Recette ou Dépense.',
            'categorie.required' => 'La catégorie est obligatoire.',
            'description.required' => 'La description est obligatoire.',
            'montant_prevu.required' => 'Le montant prévu est obligatoire.',
            'montant_prevu.min' => 'Le montant ne peut pas être négatif.',
            'mois.required' => 'Le mois est obligatoire.',
            'mois.min' => 'Le mois doit être entre 1 et 12.',
            'mois.max' => 'Le mois doit être entre 1 et 12.',
            'annee.required' => 'L\'année est obligatoire.',
        ];
    }
}
