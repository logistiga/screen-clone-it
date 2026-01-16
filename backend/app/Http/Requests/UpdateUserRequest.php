<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        $user = $this->route('user');
        return $this->user()?->can('update', $user) ?? false;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;
        
        return [
            'nom' => $this->shortTextRules(false, 2, 100),
            'email' => array_merge(
                $this->emailRules(false),
                ['unique:users,email,' . $userId]
            ),
            'password' => [
                'nullable',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
                'confirmed',
                'max:100',
            ],
            'password_confirmation' => 'nullable|string|required_with:password',
            'role' => [
                'sometimes',
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
            'nom.min' => 'Le nom doit contenir au moins 2 caractères.',
            'nom.max' => 'Le nom ne peut pas dépasser 100 caractères.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'password.mixed' => 'Le mot de passe doit contenir des majuscules et minuscules.',
            'password.numbers' => 'Le mot de passe doit contenir au moins un chiffre.',
            'password.symbols' => 'Le mot de passe doit contenir au moins un caractère spécial.',
            'password.uncompromised' => 'Ce mot de passe a été compromis. Veuillez en choisir un autre.',
            'role.exists' => 'Le rôle sélectionné n\'existe pas.',
            'role.regex' => 'Le format du rôle est invalide.',
            'password_confirmation.required_with' => 'La confirmation du mot de passe est requise.',
        ]);
    }
}
