<?php

namespace App\Http\Requests;

class UpdateProfileRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $userId = auth()->id();
        
        return [
            'nom' => $this->shortTextRules(false, 2, 100),
            'email' => array_merge(
                $this->emailRules(false),
                ['unique:users,email,' . $userId]
            ),
        ];
    }

    public function messages(): array
    {
        return array_merge($this->commonMessages(), [
            'nom.min' => 'Le nom doit contenir au moins 2 caractères.',
            'nom.max' => 'Le nom ne peut pas dépasser 100 caractères.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
        ]);
    }
}
