<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBanqueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $banqueId = $this->route('banque')?->id;
        
        return [
            'nom' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:50|unique:banques,code,' . $banqueId,
            'adresse' => 'nullable|string|max:500',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'rib' => 'nullable|string|max:100',
            'iban' => 'nullable|string|max:50',
            'swift' => 'nullable|string|max:20',
            'actif' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de la banque est obligatoire.',
            'code.unique' => 'Ce code de banque existe déjà.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
        ];
    }
}
