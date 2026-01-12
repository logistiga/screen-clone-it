<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteDebutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:Detention,Ouverture Port,Reparation,Relache',
            'client_id' => 'required|exists:clients,id',
            'ordre_id' => 'nullable|exists:ordres_travail,id',
            'transitaire_id' => 'nullable|exists:transitaires,id',
            'armateur_id' => 'nullable|exists:armateurs,id',
            'bl_numero' => 'nullable|string|max:100',
            'conteneur_numero' => 'nullable|string|max:50',
            'conteneur_type' => 'nullable|string|max:50',
            'conteneur_taille' => 'nullable|string|max:20',
            'navire' => 'nullable|string|max:255',
            'date_creation' => 'nullable|date',
            'date_arrivee' => 'nullable|date',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'nombre_jours' => 'nullable|integer|min:0',
            'tarif_journalier' => 'nullable|numeric|min:0',
            'montant_ht' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:2000',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Le type de note est obligatoire.',
            'type.in' => 'Le type doit être Detention, Ouverture Port, Reparation ou Relache.',
            'client_id.required' => 'Le client est obligatoire.',
            'client_id.exists' => 'Le client sélectionné n\'existe pas.',
            'date_fin.after_or_equal' => 'La date de fin doit être postérieure ou égale à la date de début.',
        ];
    }
}
