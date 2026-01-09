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
            'factures' => 'required|array|min:1',
            'factures.*.id' => 'required|exists:factures,id',
            'factures.*.montant' => 'required|numeric|min:0',
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
            'factures.required' => 'Au moins une facture doit être sélectionnée.',
            'factures.min' => 'Au moins une facture doit être sélectionnée.',
            'factures.*.id.required' => 'L\'identifiant de la facture est obligatoire.',
            'factures.*.id.exists' => 'Une des factures sélectionnées n\'existe pas.',
            'factures.*.montant.required' => 'Le montant pour chaque facture est obligatoire.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $totalRepartition = collect($this->factures)->sum('montant');
            if (abs($totalRepartition - $this->montant) > 0.01) {
                $validator->errors()->add('factures', 'La somme des montants répartis doit correspondre au montant total.');
            }
        });
    }
}
