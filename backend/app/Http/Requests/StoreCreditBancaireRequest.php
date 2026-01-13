<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCreditBancaireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'banque_id' => 'required|exists:banques,id',
            'objet' => 'required|string|max:255',
            'montant_emprunte' => 'required|numeric|min:0.01|max:999999999.99',
            'taux_interet' => 'required|numeric|min:0|max:1000',
            'duree_en_mois' => 'required|integer|min:1|max:360',
            'date_debut' => 'required|date',
            'notes' => 'nullable|string|max:2000',
        ];
    }

    public function messages(): array
    {
        return [
            'banque_id.required' => 'La banque est obligatoire.',
            'banque_id.exists' => 'La banque sélectionnée n\'existe pas.',
            'objet.required' => 'L\'objet du crédit est obligatoire.',
            'montant_emprunte.required' => 'Le montant emprunté est obligatoire.',
            'montant_emprunte.min' => 'Le montant doit être supérieur à 0.',
            'taux_interet.required' => 'Le taux d\'intérêt est obligatoire.',
            'taux_interet.max' => 'Le taux d\'intérêt ne peut pas dépasser 1000%.',
            'duree_en_mois.required' => 'La durée est obligatoire.',
            'duree_en_mois.min' => 'La durée doit être d\'au moins 1 mois.',
            'date_debut.required' => 'La date de début est obligatoire.',
        ];
    }
}
