<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategorieDepenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('caisse.modifier');
    }

    public function rules(): array
    {
        $categorieId = $this->route('categoriesDepense')?->id;

        return [
            'nom' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:100',
                Rule::unique('categories_depenses', 'nom')->ignore($categorieId),
            ],
            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
            'type' => [
                'sometimes',
                'required',
                'string',
                'in:Entrée,Sortie',
            ],
            'couleur' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^#[0-9A-Fa-f]{6}$|^[a-zA-Z]+$/',
            ],
            'actif' => [
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.min' => 'Le nom doit contenir au moins 2 caractères.',
            'nom.max' => 'Le nom ne peut pas dépasser 100 caractères.',
            'nom.unique' => 'Une catégorie avec ce nom existe déjà.',
            'type.in' => 'Le type doit être "Entrée" ou "Sortie".',
            'couleur.regex' => 'La couleur doit être un code hexadécimal valide (#RRGGBB) ou un nom de couleur.',
        ];
    }
}
