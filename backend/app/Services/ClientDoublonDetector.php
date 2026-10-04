<?php

namespace App\Services;

use App\Models\Client;

/**
 * Détecte un client probablement déjà enregistré.
 * Identifiants forts uniquement (NIF, RCCM, email, téléphone, nom identique) :
 * deux noms simplement ressemblants ne sont pas bloqués.
 */
class ClientDoublonDetector
{
    /** @return array{client: Client, champ: string}|null */
    public static function trouver(array $data): ?array
    {
        foreach (['nif' => 'NIF', 'rccm' => 'RCCM', 'email' => 'email'] as $col => $label) {
            $val = trim((string) ($data[$col] ?? ''));
            if ($val !== '' && ($c = Client::whereRaw("LOWER(TRIM($col)) = ?", [mb_strtolower($val)])->first())) {
                return ['client' => $c, 'champ' => $label];
            }
        }

        $tel = preg_replace('/\D+/', '', (string) ($data['telephone'] ?? ''));
        if (strlen($tel) >= 6) {
            $suffixe = substr($tel, -8);
            $candidats = Client::whereNotNull('telephone')->where('telephone', 'like', '%' . substr($suffixe, -4))->get(['id', 'nom', 'telephone']);
            foreach ($candidats as $c) {
                if (substr(preg_replace('/\D+/', '', (string) $c->telephone), -8) === $suffixe) {
                    return ['client' => $c, 'champ' => 'téléphone'];
                }
            }
        }

        $nom = mb_strtolower(preg_replace('/\s+/', ' ', trim((string) ($data['nom'] ?? ''))));
        if ($nom !== '' && ($c = Client::whereRaw('LOWER(TRIM(nom)) = ?', [$nom])->first())) {
            return ['client' => $c, 'champ' => 'nom'];
        }

        return null;
    }
}
