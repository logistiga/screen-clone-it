<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEntrepriseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'adresse' => 'nullable|string|max:500',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'nif' => 'nullable|string|max:100',
            'rccm' => 'nullable|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de l\'entreprise est obligatoire.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
        ];
    }
}
