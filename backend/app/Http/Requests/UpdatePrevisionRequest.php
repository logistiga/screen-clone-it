<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePrevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'sometimes|in:recette,depense',
            'categorie' => 'sometimes|string|max:100',
            'description' => 'sometimes|nullable|string|max:500',
            'notes' => 'sometimes|nullable|string|max:2000',
            'montant_prevu' => 'sometimes|numeric|min:0|max:999999999.99',
            'mois' => 'sometimes|integer|min:1|max:12',
            'annee' => 'sometimes|integer|min:2020|max:2100',
            'statut' => 'sometimes|in:en_cours,atteint,depasse,non_atteint',
        ];
    }

    public function messages(): array
    {
        return [
            'type.in' => 'Le type doit être recette ou dépense.',
            'categorie.max' => 'La catégorie ne doit pas dépasser 100 caractères.',
            'montant_prevu.numeric' => 'Le montant prévu doit être un nombre.',
            'montant_prevu.min' => 'Le montant prévu ne peut pas être négatif.',
            'statut.in' => 'Le statut sélectionné n\'est pas valide.',
        ];
    }
}
