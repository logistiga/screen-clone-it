<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaiementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'facture_id' => 'required|exists:factures,id',
            'montant' => 'required|numeric|min:0.01|max:999999999.99',
            'mode_paiement' => 'required|in:Espèces,Chèque,Virement,Mobile Money',
            'reference' => 'nullable|string|max:100',
            'banque_id' => 'nullable|exists:banques,id',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'facture_id.required' => 'La facture est obligatoire.',
            'facture_id.exists' => 'La facture sélectionnée n\'existe pas.',
            'montant.required' => 'Le montant est obligatoire.',
            'montant.min' => 'Le montant doit être supérieur à 0.',
            'montant.max' => 'Le montant est trop élevé.',
            'mode_paiement.required' => 'Le mode de paiement est obligatoire.',
            'mode_paiement.in' => 'Le mode de paiement sélectionné n\'est pas valide.',
            'banque_id.exists' => 'La banque sélectionnée n\'existe pas.',
        ];
    }
}
