<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrdreTravailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => 'sometimes|exists:clients,id',
            'transitaire_id' => 'nullable|exists:transitaires,id',
            'type_document' => 'sometimes|in:Conteneur,Lot,Independant',
            'type_operation' => 'nullable|string|max:100',
            'type_operation_indep' => 'nullable|string|max:100',
            'bl_numero' => 'nullable|string|max:100',
            'navire' => 'nullable|string|max:255',
            'date_arrivee' => 'nullable|date',
            'lieu_chargement' => 'nullable|string|max:255',
            'lieu_dechargement' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:2000',
            'statut' => 'sometimes|in:en_cours,termine,facture,annule',
            
            // Lignes (Opérations indépendantes)
            'lignes' => 'nullable|array',
            'lignes.*.type_operation' => 'required_with:lignes|string|max:100',
            'lignes.*.description' => 'nullable|string|max:500',
            'lignes.*.lieu_depart' => 'nullable|string|max:255',
            'lignes.*.lieu_arrivee' => 'nullable|string|max:255',
            'lignes.*.date_debut' => 'nullable|date',
            'lignes.*.date_fin' => 'nullable|date|after_or_equal:lignes.*.date_debut',
            'lignes.*.quantite' => 'nullable|numeric|min:0',
            'lignes.*.prix_unitaire' => 'nullable|numeric|min:0',
            
            // Conteneurs
            'conteneurs' => 'nullable|array',
            'conteneurs.*.numero' => 'required_with:conteneurs|string|max:50',
            'conteneurs.*.type' => 'nullable|string|max:50',
            'conteneurs.*.taille' => 'nullable|string|max:20',
            'conteneurs.*.description' => 'nullable|string|max:500',
            'conteneurs.*.prix_unitaire' => 'nullable|numeric|min:0',
            'conteneurs.*.armateur_id' => 'nullable|exists:armateurs,id',
            'conteneurs.*.operations' => 'nullable|array',
            'conteneurs.*.operations.*.type_operation' => 'required|string|max:100',
            'conteneurs.*.operations.*.description' => 'nullable|string|max:500',
            'conteneurs.*.operations.*.quantite' => 'nullable|numeric|min:0',
            'conteneurs.*.operations.*.prix_unitaire' => 'nullable|numeric|min:0',
            'lots' => 'nullable|array',
            'lots.*.designation' => 'nullable|string|max:255',
            'lots.*.description' => 'nullable|string|max:500',
            'lots.*.numero_lot' => 'nullable|string|max:100',
            'lots.*.quantite' => 'nullable|numeric|min:0',
            'lots.*.poids' => 'nullable|numeric|min:0',
            'lots.*.volume' => 'nullable|numeric|min:0',
            'lots.*.prix_unitaire' => 'nullable|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'client_id.exists' => 'Le client sélectionné n\'existe pas.',
            'type_document.in' => 'Le type de document doit être Conteneur, Lot ou Independant.',
            'statut.in' => 'Le statut sélectionné n\'est pas valide.',
        ];
    }
}
