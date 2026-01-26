<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFactureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('factures.creer');
    }

    public function rules(): array
    {
        return [
            // Relations - IDs validés strictement
            'client_id' => ['required', 'integer', 'min:1', 'exists:clients,id'],
            'transitaire_id' => ['nullable', 'integer', 'min:1', 'exists:transitaires,id'],
            'representant_id' => ['nullable', 'integer', 'min:1', 'exists:representants,id'],
            'armateur_id' => ['nullable', 'integer', 'min:1', 'exists:armateurs,id'],
            'ordre_travail_id' => ['nullable', 'integer', 'min:1', 'exists:ordres_travail,id'],
            
            // Type de document - Enum strict
            'type_document' => ['required', 'string', 'in:Conteneur,Lot,Independant'],
            'type_operation' => ['nullable', 'string', 'max:100'],
            'type_operation_indep' => ['nullable', 'string', 'in:transport,manutention,stockage,location,double_relevage'],
            
            // Dates
            'date_echeance' => ['nullable', 'date', 'date_format:Y-m-d', 'after_or_equal:today'],
            'date_arrivee' => ['nullable', 'date', 'date_format:Y-m-d'],
            
            // Champs texte avec limites strictes
            'bl_numero' => ['nullable', 'string', 'max:50', 'regex:/^[A-Za-z0-9\-\/]+$/'],
            'navire' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            
            // Montants - Limites strictes, 2 décimales max
            'prime_transitaire' => ['nullable', 'numeric', 'min:0', 'max:999999999.99', 'regex:/^\d+(\.\d{1,2})?$/'],
            'prime_representant' => ['nullable', 'numeric', 'min:0', 'max:999999999.99', 'regex:/^\d+(\.\d{1,2})?$/'],
            
            // Remise
            'remise_type' => ['nullable', 'string', 'in:pourcentage,montant'],
            'remise_valeur' => ['nullable', 'numeric', 'min:0', 'max:100'], // Max 100% pour pourcentage
            'remise_montant' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            
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
            
            // Lignes - Tableau limité
            'lignes' => ['nullable', 'array', 'max:100'],
            'lignes.*.type_operation' => ['required_with:lignes', 'string', 'max:100'],
            'lignes.*.description' => ['nullable', 'string', 'max:500'],
            'lignes.*.lieu_depart' => ['nullable', 'string', 'max:255'],
            'lignes.*.lieu_arrivee' => ['nullable', 'string', 'max:255'],
            'lignes.*.date_debut' => ['nullable', 'date', 'date_format:Y-m-d'],
            'lignes.*.date_fin' => ['nullable', 'date', 'date_format:Y-m-d', 'after_or_equal:lignes.*.date_debut'],
            'lignes.*.quantite' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'lignes.*.prix_unitaire' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            
            // Conteneurs - Tableau limité
            'conteneurs' => ['nullable', 'array', 'max:50'],
            'conteneurs.*.numero' => ['required_with:conteneurs', 'string', 'max:20', 'regex:/^[A-Z]{4}[0-9]{7}$|^[A-Za-z0-9\-]+$/'],
            'conteneurs.*.type' => ['required_with:conteneurs', 'string', 'max:30'],
            'conteneurs.*.taille' => ['required_with:conteneurs', 'string', 'max:10', 'in:20,40,40HC,45'],
            'conteneurs.*.description' => ['nullable', 'string', 'max:500'],
            'conteneurs.*.prix_unitaire' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'conteneurs.*.armateur_id' => ['nullable', 'integer', 'min:1', 'exists:armateurs,id'],
            'conteneurs.*.operations' => ['nullable', 'array', 'max:20'],
            'conteneurs.*.operations.*.type_operation' => ['required', 'string', 'max:100'],
            'conteneurs.*.operations.*.description' => ['nullable', 'string', 'max:500'],
            'conteneurs.*.operations.*.quantite' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'conteneurs.*.operations.*.prix_unitaire' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            
            // Lots - Tableau limité
            'lots' => ['nullable', 'array', 'max:100'],
            'lots.*.designation' => ['required_with:lots', 'string', 'max:255'],
            'lots.*.quantite' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'lots.*.poids' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'lots.*.volume' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'lots.*.prix_unitaire' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
        ];
    }

    /**
     * Préparer les données avant validation
     */
    protected function prepareForValidation(): void
    {
        // Trim les champs texte
        $trimFields = ['bl_numero', 'navire', 'notes'];
        $data = [];
        
        foreach ($trimFields as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $data[$field] = trim($this->input($field));
            }
        }

        // Normaliser le numéro BL en majuscules
        if ($this->has('bl_numero') && is_string($this->input('bl_numero'))) {
            $data['bl_numero'] = strtoupper(trim($this->input('bl_numero')));
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }

    public function messages(): array
    {
        return [
            'client_id.required' => 'Le client est obligatoire.',
            'client_id.exists' => 'Le client sélectionné n\'existe pas.',
            'client_id.integer' => 'L\'identifiant client doit être un nombre.',
            'type_document.required' => 'Le type de document est obligatoire.',
            'type_document.in' => 'Le type de document doit être Conteneur, Lot ou Independant.',
            'date_echeance.after_or_equal' => 'La date d\'échéance doit être aujourd\'hui ou ultérieure.',
            'date_echeance.date_format' => 'La date d\'échéance doit être au format AAAA-MM-JJ.',
            'bl_numero.regex' => 'Le numéro BL contient des caractères invalides.',
            'bl_numero.max' => 'Le numéro BL ne peut pas dépasser 50 caractères.',
            'prime_transitaire.regex' => 'La prime transitaire doit avoir au maximum 2 décimales.',
            'prime_transitaire.max' => 'La prime transitaire est trop élevée.',
            'prime_representant.regex' => 'La prime représentant doit avoir au maximum 2 décimales.',
            'prime_representant.max' => 'La prime représentant est trop élevée.',
            'lignes.max' => 'Maximum 100 lignes autorisées.',
            'conteneurs.max' => 'Maximum 50 conteneurs autorisés.',
            'conteneurs.*.numero.regex' => 'Le numéro de conteneur est invalide.',
            'conteneurs.*.taille.in' => 'La taille du conteneur doit être 20, 40, 40HC ou 45.',
            'lots.max' => 'Maximum 100 lots autorisés.',
        ];
    }
}
