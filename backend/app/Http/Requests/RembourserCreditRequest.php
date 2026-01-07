<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RembourserCreditRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'montant' => 'required|numeric|min:0.01|max:999999999.99',
            'mode_paiement' => 'required|in:Espèces,Chèque,Virement',
            'reference' => 'nullable|string|max:100',
            'echeance_id' => 'nullable|exists:echeances_credit,id',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'montant.required' => 'Le montant est obligatoire.',
            'montant.min' => 'Le montant doit être supérieur à 0.',
            'mode_paiement.required' => 'Le mode de paiement est obligatoire.',
            'mode_paiement.in' => 'Le mode de paiement doit être Espèces, Chèque ou Virement.',
            'echeance_id.exists' => 'L\'échéance sélectionnée n\'existe pas.',
        ];
    }
}
