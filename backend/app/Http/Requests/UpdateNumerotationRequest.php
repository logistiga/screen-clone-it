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
            'prefixe_devis' => 'sometimes|required|string|max:10|alpha_num',
            'prefixe_ordre' => 'sometimes|required|string|max:10|alpha_num',
            'prefixe_facture' => 'sometimes|required|string|max:10|alpha_num',
            'prefixe_avoir' => 'sometimes|required|string|max:10|alpha_num',
            'format_annee' => 'sometimes|boolean',

            'prochain_numero_devis' => 'sometimes|required|integer|min:1|max:9999',
            'prochain_numero_ordre' => 'sometimes|required|integer|min:1|max:9999',
            'prochain_numero_facture' => 'sometimes|required|integer|min:1|max:9999',
            'prochain_numero_avoir' => 'sometimes|required|integer|min:1|max:9999',
        ];
    }

    public function messages(): array
    {
        return [
            'prefixe_devis.alpha_num' => 'Le préfixe ne peut contenir que des lettres et chiffres.',
            'prefixe_ordre.alpha_num' => 'Le préfixe ne peut contenir que des lettres et chiffres.',
            'prefixe_facture.alpha_num' => 'Le préfixe ne peut contenir que des lettres et chiffres.',
            'prefixe_avoir.alpha_num' => 'Le préfixe ne peut contenir que des lettres et chiffres.',

            'prochain_numero_devis.integer' => 'Le compteur devis doit être un nombre.',
            'prochain_numero_ordre.integer' => 'Le compteur ordre doit être un nombre.',
            'prochain_numero_facture.integer' => 'Le compteur facture doit être un nombre.',
            'prochain_numero_avoir.integer' => 'Le compteur avoir doit être un nombre.',
        ];
    }
}
