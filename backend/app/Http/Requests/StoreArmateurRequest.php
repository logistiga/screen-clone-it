<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreArmateurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:armateurs,code',
            'adresse' => 'nullable|string|max:500',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'actif' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de l\'armateur est obligatoire.',
            'code.unique' => 'Ce code d\'armateur existe déjà.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
        ];
    }
}
