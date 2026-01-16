<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->route('role');
        
        // Seul un admin peut modifier les rôles
        if (!$this->user()->hasRole('administrateur')) {
            return false;
        }

        // Interdit de modifier les rôles système
        if ($role && in_array($role->name, ['administrateur', 'directeur'])) {
            return false;
        }

        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('role')?->id;

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:50',
                Rule::unique('roles', 'name')->ignore($roleId),
                'regex:/^[a-zA-Z0-9_\-\s]+$/',
            ],
            'description' => [
                'nullable',
                'string',
                'max:500',
            ],
            'permissions' => [
                'sometimes',
                'array',
                'max:200',
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
            'name.min' => 'Le nom du rôle doit contenir au moins 2 caractères.',
            'name.max' => 'Le nom du rôle ne peut pas dépasser 50 caractères.',
            'name.unique' => 'Ce nom de rôle existe déjà.',
            'name.regex' => 'Le nom du rôle ne peut contenir que des lettres, chiffres, tirets et underscores.',
            'description.max' => 'La description ne peut pas dépasser 500 caractères.',
            'permissions.max' => 'Trop de permissions sélectionnées.',
            'permissions.*.exists' => 'Une des permissions sélectionnées n\'existe pas.',
        ];
    }
}
