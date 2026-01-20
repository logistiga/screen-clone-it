<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Base FormRequest avec règles de validation communes
 * Toutes les FormRequests doivent étendre cette classe
 */
abstract class BaseFormRequest extends FormRequest
{
    /**
     * Règles de validation communes pour les montants
     */
    protected function amountRules(bool $required = true, float $min = 0, float $max = 999999999999.99): array
    {
        $rules = [
            'numeric',
            "min:{$min}",
            "max:{$max}",
            'regex:/^\d+(\.\d{1,2})?$/', // Max 2 décimales
        ];

        if ($required) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'nullable');
        }

        return $rules;
    }

    /**
     * Règles de validation pour les dates
     */
    protected function dateRules(bool $required = true): array
    {
        $rules = ['date', 'date_format:Y-m-d'];

        if ($required) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'nullable');
        }

        return $rules;
    }

    /**
     * Règles de validation pour les emails
     */
    protected function emailRules(bool $required = true): array
    {
        $rules = ['email:rfc,dns', 'max:255'];

        if ($required) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'nullable');
        }

        return $rules;
    }

    /**
     * Règles de validation pour les téléphones
     */
    protected function phoneRules(bool $required = false): array
    {
        $rules = [
            'string',
            'max:20',
            'regex:/^[\+]?[0-9\s\-\(\)]+$/', // Format téléphone international
        ];

        if ($required) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'nullable');
        }

        return $rules;
    }

    /**
     * Règles de validation pour les pourcentages
     */
    protected function percentageRules(bool $required = false): array
    {
        $rules = [
            'numeric',
            'min:0',
            'max:100',
            'regex:/^\d+(\.\d{1,2})?$/',
        ];

        if ($required) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'nullable');
        }

        return $rules;
    }

    /**
     * Règles de validation pour les IDs de clé étrangère
     */
    protected function foreignKeyRules(string $table, string $column = 'id', bool $required = true): array
    {
        $rules = ['integer', 'min:1', "exists:{$table},{$column}"];

        if ($required) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'nullable');
        }

        return $rules;
    }

    /**
     * Règles pour les champs texte courts (nom, titre)
     */
    protected function shortTextRules(bool $required = true, int $min = 1, int $max = 100): array
    {
        $rules = ['string', 'min:' . $min, 'max:' . $max];

        if ($required) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'nullable');
        }

        return $rules;
    }

    /**
     * Règles pour les champs texte longs (description, notes)
     */
    protected function longTextRules(bool $required = false, int $max = 2000): array
    {
        $rules = ['string', 'max:' . $max];

        if ($required) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'nullable');
        }

        return $rules;
    }

    /**
     * Préparer les données avant validation
     * Sanitize les inputs communs
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        // Trim tous les champs string
        foreach ($this->all() as $key => $value) {
            if (is_string($value)) {
                $data[$key] = trim($value);
            }
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }

    /**
     * Messages d'erreur communs en français
     */
    protected function commonMessages(): array
    {
        return [
            'required' => 'Le champ :attribute est obligatoire.',
            'string' => 'Le champ :attribute doit être une chaîne de caractères.',
            'integer' => 'Le champ :attribute doit être un nombre entier.',
            'numeric' => 'Le champ :attribute doit être un nombre.',
            'email' => 'Le champ :attribute doit être une adresse email valide.',
            'date' => 'Le champ :attribute doit être une date valide.',
            'date_format' => 'Le champ :attribute ne correspond pas au format :format.',
            'min' => [
                'numeric' => 'Le champ :attribute doit être au moins :min.',
                'string' => 'Le champ :attribute doit contenir au moins :min caractères.',
            ],
            'max' => [
                'numeric' => 'Le champ :attribute ne peut pas dépasser :max.',
                'string' => 'Le champ :attribute ne peut pas dépasser :max caractères.',
            ],
            'unique' => 'Cette valeur pour :attribute existe déjà.',
            'exists' => 'La valeur sélectionnée pour :attribute est invalide.',
            'in' => 'La valeur sélectionnée pour :attribute est invalide.',
            'regex' => 'Le format du champ :attribute est invalide.',
            'boolean' => 'Le champ :attribute doit être vrai ou faux.',
        ];
    }
}
