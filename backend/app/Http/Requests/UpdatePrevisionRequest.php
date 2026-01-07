<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePrevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => 'sometimes|required|string|max:500',
            'montant_prevu' => 'sometimes|required|numeric|min:0|max:999999999.99',
            'montant_realise' => 'sometimes|numeric|min:0|max:999999999.99',
            'date_prevue' => 'nullable|date',
            'statut' => 'sometimes|in:En cours,Atteint,Non atteint',
        ];
    }

    public function messages(): array
    {
        return [
            'description.required' => 'La description est obligatoire.',
            'montant_prevu.min' => 'Le montant prévu ne peut pas être négatif.',
            'montant_realise.min' => 'Le montant réalisé ne peut pas être négatif.',
            'statut.in' => 'Le statut sélectionné n\'est pas valide.',
        ];
    }
}
