<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDevisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Champs principaux
            'client_id' => 'required|exists:clients,id',
            'transitaire_id' => 'nullable|exists:transitaires,id',
            'representant_id' => 'nullable|exists:representants,id',
            'armateur_id' => 'nullable|exists:armateurs,id',
            
            // Type de document
            'type_document' => 'required|in:Conteneur,Lot,Independant',
            'type_operation' => 'nullable|string|in:import,export',
            'type_operation_indep' => 'nullable|string|in:location,transport,manutention,double_relevage,stockage',
            
            // Infos navire
            'bl_numero' => 'nullable|string|max:100',
            'navire' => 'nullable|string|max:255',
            'date_arrivee' => 'nullable|date',
            
            // Validité et notes
            'validite_jours' => 'nullable|integer|min:1|max:365',
            'notes' => 'nullable|string|max:2000',
            
            // Remise
            'remise_type' => 'nullable|string|in:pourcentage,montant',
            'remise_valeur' => 'nullable|numeric|min:0',
            'remise_montant' => 'nullable|numeric|min:0',
            
            // Lignes (opérations indépendantes)
            'lignes' => 'nullable|array',
            'lignes.*.type_operation' => 'nullable|string|max:100',
            'lignes.*.description' => 'nullable|string|max:500',
            'lignes.*.lieu_depart' => 'nullable|string|max:255',
            'lignes.*.lieu_arrivee' => 'nullable|string|max:255',
            'lignes.*.date_debut' => 'nullable|date',
            'lignes.*.date_fin' => 'nullable|date',
            'lignes.*.quantite' => 'nullable|numeric|min:0',
            'lignes.*.prix_unitaire' => 'nullable|numeric|min:0',
            
            // Conteneurs
            'conteneurs' => 'nullable|array',
            'conteneurs.*.numero' => 'nullable|string|max:50',
            'conteneurs.*.type' => 'nullable|string|max:50',
            'conteneurs.*.taille' => 'nullable|string|max:20',
            'conteneurs.*.armateur_id' => 'nullable|exists:armateurs,id',
            'conteneurs.*.description' => 'nullable|string|max:500',
            'conteneurs.*.prix_unitaire' => 'nullable|numeric|min:0',
            'conteneurs.*.operations' => 'nullable|array',
            'conteneurs.*.operations.*.type_operation' => 'nullable|string|max:100',
            'conteneurs.*.operations.*.description' => 'nullable|string|max:500',
            'conteneurs.*.operations.*.quantite' => 'nullable|numeric|min:0',
            'conteneurs.*.operations.*.prix_unitaire' => 'nullable|numeric|min:0',
            
            // Lots
            'lots' => 'nullable|array',
            'lots.*.designation' => 'nullable|string|max:255',
            'lots.*.description' => 'nullable|string|max:255',
            'lots.*.numero_lot' => 'nullable|string|max:50',
            'lots.*.quantite' => 'nullable|numeric|min:0',
            'lots.*.poids' => 'nullable|numeric|min:0',
            'lots.*.volume' => 'nullable|numeric|min:0',
            'lots.*.prix_unitaire' => 'nullable|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'client_id.required' => 'Le client est obligatoire.',
            'client_id.exists' => 'Le client sélectionné n\'existe pas.',
            'type_document.required' => 'Le type de document est obligatoire.',
            'type_document.in' => 'Le type de document doit être Conteneur, Lot ou Independant.',
        ];
    }
}
