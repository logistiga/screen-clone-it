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
            'representant_id' => 'nullable|exists:representants,id',
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

            // Primes
            'prime_transitaire' => 'nullable|numeric|min:0',
            'prime_representant' => 'nullable|numeric|min:0',
            
            // Remise
            'remise_type' => 'nullable|string|in:pourcentage,montant,none',
            'remise_valeur' => 'nullable|numeric|min:0',
            'remise_montant' => 'nullable|numeric|min:0',
            
            // Exonérations (legacy - rétrocompatibilité)
            'exonere_tva' => ['nullable', 'boolean'],
            'exonere_css' => ['nullable', 'boolean'],
            'motif_exoneration' => ['nullable', 'string', 'max:255'],
            
            // Nouvelle structure taxes_selection (JSON)
            'taxes_selection' => ['nullable', 'array'],
            'taxes_selection.selected_tax_codes' => ['required_with:taxes_selection', 'present', 'array', 'max:20'],
            'taxes_selection.selected_tax_codes.*' => ['string', 'max:20', 'regex:/^[A-Z0-9_]+$/'],
            'taxes_selection.has_exoneration' => ['nullable', 'boolean'],
            'taxes_selection.exonerated_tax_codes' => ['nullable', 'array', 'max:20'],
            'taxes_selection.exonerated_tax_codes.*' => ['string', 'max:20', 'regex:/^[A-Z0-9_]+$/'],
            'taxes_selection.motif_exoneration' => ['required_if:taxes_selection.has_exoneration,true', 'nullable', 'string', 'max:255'],
            
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
