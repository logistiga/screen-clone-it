<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBanqueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:banques,code',
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
            'nom.max' => 'Le nom ne peut pas dépasser 255 caractères.',
            'code.unique' => 'Ce code de banque existe déjà.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
        ];
    }
}
