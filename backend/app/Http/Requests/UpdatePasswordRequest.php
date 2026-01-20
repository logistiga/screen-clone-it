<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rules\Password;

class UpdatePasswordRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'current_password' => [
                'required',
                'string',
                'max:100',
            ],
            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->symbols(),
                'confirmed',
                'max:100',
                'different:current_password',
            ],
            'password_confirmation' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return array_merge($this->commonMessages(), [
            'current_password.required' => 'Le mot de passe actuel est obligatoire.',
            'password.required' => 'Le nouveau mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'password.mixed' => 'Le mot de passe doit contenir des majuscules et minuscules.',
            'password.numbers' => 'Le mot de passe doit contenir au moins un chiffre.',
            'password.symbols' => 'Le mot de passe doit contenir au moins un caractère spécial.',
            'password.uncompromised' => 'Ce mot de passe a été compromis. Veuillez en choisir un autre.',
            'password.different' => 'Le nouveau mot de passe doit être différent de l\'ancien.',
        ]);
    }
}
