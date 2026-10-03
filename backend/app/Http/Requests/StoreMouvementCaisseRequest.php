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
            // Antidatage limité à 7 jours (la date réelle de saisie reste dans created_at)
            'date' => 'nullable|date|before_or_equal:today|after_or_equal:' . now()->subDays(7)->toDateString(),
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
            'date.before_or_equal' => 'La date ne peut pas être dans le futur.',
            'date.after_or_equal' => 'La date ne peut pas remonter à plus de 7 jours.',
        ];
    }
}
