<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaiementGlobalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => 'required|exists:clients,id',
            'montant' => 'required|numeric|min:0.01|max:999999999.99',
            'mode_paiement' => 'required|in:Espèces,Chèque,Virement,Mobile Money',
            'reference' => 'nullable|string|max:100',
            'banque_id' => 'nullable|exists:banques,id',
            // Factures (optionnel si ordres présent)
            'factures' => 'nullable|array',
            'factures.*.id' => 'required_with:factures|exists:factures,id',
            'factures.*.montant' => 'required_with:factures|numeric|min:0',
            // Ordres (optionnel si factures présent)
            'ordres' => 'nullable|array',
            'ordres.*.id' => 'required_with:ordres|exists:ordres_travail,id',
            'ordres.*.montant' => 'required_with:ordres|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'client_id.required' => 'Le client est obligatoire.',
            'client_id.exists' => 'Le client sélectionné n\'existe pas.',
            'montant.required' => 'Le montant total est obligatoire.',
            'montant.min' => 'Le montant doit être supérieur à 0.',
            'mode_paiement.required' => 'Le mode de paiement est obligatoire.',
            'mode_paiement.in' => 'Le mode de paiement sélectionné n\'est pas valide.',
            'factures.*.id.exists' => 'Une des factures sélectionnées n\'existe pas.',
            'factures.*.montant.required_with' => 'Le montant pour chaque facture est obligatoire.',
            'ordres.*.id.exists' => 'Un des ordres de travail sélectionnés n\'existe pas.',
            'ordres.*.montant.required_with' => 'Le montant pour chaque ordre est obligatoire.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $hasFactures = !empty($this->factures);
            $hasOrdres = !empty($this->ordres);
            
            if (!$hasFactures && !$hasOrdres) {
                $validator->errors()->add('factures', 'Au moins une facture ou un ordre de travail doit être sélectionné.');
                return;
            }
            
            $totalFactures = collect($this->factures ?? [])->sum('montant');
            $totalOrdres = collect($this->ordres ?? [])->sum('montant');
            $totalRepartition = $totalFactures + $totalOrdres;
            
            if (abs($totalRepartition - $this->montant) > 0.01) {
                $validator->errors()->add('montant', 'La somme des montants répartis doit correspondre au montant total.');
            }
        });
    }
}
