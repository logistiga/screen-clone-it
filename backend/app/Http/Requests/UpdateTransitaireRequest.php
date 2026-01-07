<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTransitaireRequest extends FormRequest
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
            'adresse' => 'nullable|string|max:500',
            'contact_principal' => 'nullable|string|max:255',
            'nif' => 'nullable|string|max:100',
            'rccm' => 'nullable|string|max:100',
            'actif' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom du transitaire est obligatoire.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
        ];
    }
}
