<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:50',
            'adresse' => 'nullable|string|max:1000',
            'ville' => 'nullable|string|max:255',
            'pays' => 'nullable|string|max:100',
            'type' => 'required|in:Particulier,Entreprise',
            'nif' => 'nullable|string|max:100',
            'rccm' => 'nullable|string|max:100',
            'contact_principal' => 'nullable|string|max:255',
            'limite_credit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:5000',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom du client est obligatoire.',
            'nom.max' => 'Le nom ne peut pas dépasser 255 caractères.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
            'type.required' => 'Le type de client est obligatoire.',
            'type.in' => 'Le type doit être Particulier ou Entreprise.',
        ];
    }
}
