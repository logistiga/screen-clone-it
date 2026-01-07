<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'configurations' => 'required|array|min:1',
            'configurations.*.cle' => 'required|string|max:100',
            'configurations.*.valeur' => 'required',
        ];
    }

    public function messages(): array
    {
        return [
            'configurations.required' => 'Au moins une configuration est requise.',
            'configurations.*.cle.required' => 'La clé de configuration est obligatoire.',
            'configurations.*.valeur.required' => 'La valeur de configuration est obligatoire.',
        ];
    }
}
