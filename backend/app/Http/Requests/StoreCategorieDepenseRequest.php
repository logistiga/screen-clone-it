<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategorieDepenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('caisse.creer');
    }

    public function rules(): array
    {
        return [
            'nom' => [
                'required',
                'string',
                'min:2',
                'max:100',
                'unique:categories_depenses,nom',
            ],
            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
            'type' => [
                'required',
                'string',
                'in:Entrée,Sortie',
            ],
            'couleur' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^#[0-9A-Fa-f]{6}$|^[a-zA-Z]+$/', // Hex color or named color
            ],
            'actif' => [
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de la catégorie est obligatoire.',
            'nom.min' => 'Le nom doit contenir au moins 2 caractères.',
            'nom.max' => 'Le nom ne peut pas dépasser 100 caractères.',
            'nom.unique' => 'Une catégorie avec ce nom existe déjà.',
            'type.required' => 'Le type de catégorie est obligatoire.',
            'type.in' => 'Le type doit être "Entrée" ou "Sortie".',
            'couleur.regex' => 'La couleur doit être un code hexadécimal valide (#RRGGBB) ou un nom de couleur.',
        ];
    }
}
