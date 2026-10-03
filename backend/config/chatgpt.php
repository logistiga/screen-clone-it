<?php

/*
| Intégration ChatGPT (lecture seule) — /api/gpt/*
| Les tokens sont lus depuis l'environnement, jamais depuis Git.
| CHATGPT_API_TOKENS : liste séparée par des virgules (rotation sans coupure).
*/

return [
    'enabled' => env('CHATGPT_API_ENABLED', true),
    'tokens' => array_values(array_filter(array_map('trim', explode(',', (string) env('CHATGPT_API_TOKENS', ''))))),
    'rate_limit_per_minute' => (int) env('CHATGPT_API_RATE_LIMIT', 60),
    'max_limit' => 200,
    'default_limit' => 50,
    'search_limit_per_resource' => 10,
    'log_channel' => env('CHATGPT_API_LOG_CHANNEL', 'daily'),
];
