<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\User::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'nom' => $this->shortTextRules(true, 2, 100),
            'email' => array_merge(
                $this->emailRules(true),
                ['unique:users,email']
            ),
            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
                'confirmed',
                'max:100',
            ],
            'password_confirmation' => 'required|string',
            'role' => [
                'required',
                'string',
                'max:50',
                'exists:roles,name',
                'regex:/^[a-zA-Z_]+$/',
            ],
            'actif' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return array_merge($this->commonMessages(), [
            'nom.required' => 'Le nom est obligatoire.',
            'nom.min' => 'Le nom doit contenir au moins 2 caractères.',
            'nom.max' => 'Le nom ne peut pas dépasser 100 caractères.',
            'email.required' => 'L\'adresse email est obligatoire.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'password.mixed' => 'Le mot de passe doit contenir des majuscules et minuscules.',
            'password.numbers' => 'Le mot de passe doit contenir au moins un chiffre.',
            'password.symbols' => 'Le mot de passe doit contenir au moins un caractère spécial.',
            'password.uncompromised' => 'Ce mot de passe a été compromis. Veuillez en choisir un autre.',
            'role.required' => 'Le rôle est obligatoire.',
            'role.exists' => 'Le rôle sélectionné n\'existe pas.',
            'role.regex' => 'Le format du rôle est invalide.',
        ]);
    }
}
