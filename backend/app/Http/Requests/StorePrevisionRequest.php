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
            // Valeurs stockées en base (voir migration previsions)
            'type' => 'required|in:recette,depense',
            'source' => 'required|in:caisse,banque',

            'categorie' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:2000',

            'montant_prevu' => 'required|numeric|min:0|max:999999999.99',
            'mois' => 'required|integer|min:1|max:12',
            'annee' => 'required|integer|min:2020|max:2100',

            'date_prevue' => 'nullable|date',
            'banque_id' => 'nullable|integer|exists:banques,id',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Le type est obligatoire.',
            'type.in' => 'Le type doit être recette ou dépense.',
            'source.required' => 'La source est obligatoire.',
            'source.in' => 'La source doit être caisse ou banque.',

            'categorie.required' => 'La catégorie est obligatoire.',
            'categorie.max' => 'La catégorie ne doit pas dépasser 100 caractères.',

            'montant_prevu.required' => 'Le montant prévu est obligatoire.',
            'montant_prevu.numeric' => 'Le montant prévu doit être un nombre.',
            'montant_prevu.min' => 'Le montant ne peut pas être négatif.',

            'mois.required' => 'Le mois est obligatoire.',
            'mois.min' => 'Le mois doit être entre 1 et 12.',
            'mois.max' => 'Le mois doit être entre 1 et 12.',

            'annee.required' => 'L\'année est obligatoire.',
            'annee.min' => 'L\'année doit être >= 2020.',
            'annee.max' => 'L\'année doit être <= 2100.',

            'banque_id.exists' => 'La banque sélectionnée est invalide.',
        ];
    }
}
