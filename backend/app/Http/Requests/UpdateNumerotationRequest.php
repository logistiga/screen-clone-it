<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNumerotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prefixe_devis' => 'required|string|max:10|alpha_num',
            'prefixe_ordre' => 'required|string|max:10|alpha_num',
            'prefixe_facture' => 'required|string|max:10|alpha_num',
        ];
    }

    public function messages(): array
    {
        return [
            'prefixe_devis.required' => 'Le préfixe des devis est obligatoire.',
            'prefixe_devis.alpha_num' => 'Le préfixe ne peut contenir que des lettres et chiffres.',
            'prefixe_ordre.required' => 'Le préfixe des ordres est obligatoire.',
            'prefixe_ordre.alpha_num' => 'Le préfixe ne peut contenir que des lettres et chiffres.',
            'prefixe_facture.required' => 'Le préfixe des factures est obligatoire.',
            'prefixe_facture.alpha_num' => 'Le préfixe ne peut contenir que des lettres et chiffres.',
        ];
    }
}
