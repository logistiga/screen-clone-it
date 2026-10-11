<?php

/*
| Automatisation n8n / Mora — /api/automation/*
| AUTOMATION_API_KEYS : "nom:cle:perm1|perm2,nom2:cle2:perm1" (jamais dans Git).
| Permissions : clients:lire, devis:creer, devis:lire, factures:lire, ordres:lire, caisse:lire, dashboard:lire.
| Aucune permission de suppression, annulation, paiement ou envoi n'existe.
*/

$keys = [];
foreach (array_filter(array_map('trim', explode(',', (string) env('AUTOMATION_API_KEYS', '')))) as $entry) {
    $parts = explode(':', $entry, 3);
    if (count($parts) === 3 && strlen($parts[1]) >= 32) {
        $keys[] = [
            'name' => $parts[0],
            'key' => $parts[1],
            'permissions' => array_values(array_filter(explode('|', $parts[2]))),
        ];
    }
}

return [
    'enabled' => (bool) env('AUTOMATION_API_ENABLED', false),
    'keys' => $keys,
    'rate_limit_per_minute' => (int) env('AUTOMATION_API_RATE_LIMIT', 30),
    'idempotency_ttl_hours' => 24,
    'log_channel' => env('AUTOMATION_API_LOG_CHANNEL', 'daily'),
    'frontend_url' => env('AUTOMATION_FRONTEND_URL', 'https://facturation.logistiga.pro'),
];
