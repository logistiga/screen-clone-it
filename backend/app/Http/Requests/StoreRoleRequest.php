<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('administrateur');
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'unique:roles,name',
                'regex:/^[a-zA-Z0-9_\-\s]+$/', // Alphanumeric, underscores, hyphens, spaces only
            ],
            'description' => [
                'nullable',
                'string',
                'max:500',
            ],
            'permissions' => [
                'array',
                'max:200', // Limite le nombre de permissions
            ],
            'permissions.*' => [
                'string',
                'max:100',
                'exists:permissions,name',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du rôle est obligatoire.',
            'name.min' => 'Le nom du rôle doit contenir au moins 2 caractères.',
            'name.max' => 'Le nom du rôle ne peut pas dépasser 50 caractères.',
            'name.unique' => 'Ce nom de rôle existe déjà.',
            'name.regex' => 'Le nom du rôle ne peut contenir que des lettres, chiffres, tirets et underscores.',
            'description.max' => 'La description ne peut pas dépasser 500 caractères.',
            'permissions.array' => 'Les permissions doivent être un tableau.',
            'permissions.max' => 'Trop de permissions sélectionnées.',
            'permissions.*.exists' => 'Une des permissions sélectionnées n\'existe pas.',
        ];
    }
}
