<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:50',
            'adresse' => 'nullable|string|max:1000',
            'type' => 'sometimes|required|in:Particulier,Entreprise',
            'nif' => 'nullable|string|max:100',
            'rccm' => 'nullable|string|max:100',
            'contact_principal' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom du client est obligatoire.',
            'nom.max' => 'Le nom ne peut pas dépasser 255 caractères.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
            'type.in' => 'Le type doit être Particulier ou Entreprise.',
        ];
    }
}
