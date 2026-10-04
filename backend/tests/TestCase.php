<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Les tests touchant la base exigent une base de TEST dédiée (jamais la production).
     * Définir DB_TEST_DATABASE dans l'environnement de test pour les activer.
     */
    protected function exigerBaseDeTest(): void
    {
        $base = (string) config('database.connections.' . config('database.default') . '.database');
        if (!getenv('DB_TEST_DATABASE') || !str_contains(strtolower($base), 'test')) {
            $this->markTestSkipped('Base de test dédiée requise (DB_TEST_DATABASE contenant "test").');
        }
    }
}
