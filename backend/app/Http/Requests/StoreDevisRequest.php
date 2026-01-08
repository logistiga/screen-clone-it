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
            'client_id' => 'required|exists:clients,id',
            'transitaire_id' => 'nullable|exists:transitaires,id',
            'representant_id' => 'nullable|exists:representants,id',
            'armateur_id' => 'nullable|exists:armateurs,id',
            'type_document' => 'required|in:Conteneur,Lot,Independant',
            'bl_numero' => 'nullable|string|max:100',
            'navire' => 'nullable|string|max:255',
            'date_arrivee' => 'nullable|date',
            'validite_jours' => 'nullable|integer|min:1|max:365',
            'notes' => 'nullable|string|max:2000',
            
            // Lignes (opérations indépendantes)
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
            'conteneurs.*.taille' => 'required_with:conteneurs|string|max:20',
            'conteneurs.*.armateur_id' => 'nullable|exists:armateurs,id',
            'conteneurs.*.description' => 'nullable|string|max:500',
            'conteneurs.*.operations' => 'nullable|array',
            'conteneurs.*.operations.*.type_operation' => 'required|string|max:100',
            'conteneurs.*.operations.*.description' => 'nullable|string|max:500',
            'conteneurs.*.operations.*.quantite' => 'nullable|numeric|min:0',
            'conteneurs.*.operations.*.prix_unitaire' => 'nullable|numeric|min:0',
            
            // Lots
            'lots' => 'nullable|array',
            'lots.*.designation' => 'required_with:lots|string|max:255',
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
            'lignes.*.date_fin.after_or_equal' => 'La date de fin doit être postérieure à la date de début.',
            'conteneurs.*.numero.required_with' => 'Le numéro du conteneur est obligatoire.',
            'lots.*.designation.required_with' => 'La désignation du lot est obligatoire.',
        ];
    }
}
