# Automatisation n8n / Mora — /api/automation/*

Base : https://facturation.logistiga.pro/backend/public/api/automation
En-tête : `X-Automation-Key: <clé>` (fichier serveur ~/automation_key_n8n.txt, jamais dans Git).
Format : `{success, data, meta}` ou `{success:false, error:{code,message,details}}`.

| Méthode | Route | Permission |
|---|---|---|
| GET | /clients?search=xx | clients:lire |
| GET | /clients/{id}/historique-prix | clients:lire |
| POST | /devis (+ `X-Idempotency-Key`) | devis:creer |
| GET | /devis/{id} | devis:lire |
| GET | /factures/impayees?client_id= | factures:lire |

POST /devis : mêmes champs que la création de devis (client_id, type_document Conteneur|Lot|Independant, lignes/conteneurs/lots, prix fournis — jamais inventés). Statut forcé `brouillon`. Réponse : numero, totaux arrondis FCFA, `url_validation`. Même clé d'idempotence = même devis renvoyé (`meta.replay`).
Interdit : envoi client, conversion OT, facture, paiement, suppression.
Rotation : modifier `AUTOMATION_API_KEYS` (`nom:cle:perm1|perm2`, plusieurs séparés par virgule) puis `php artisan config:cache`. Coupure : `AUTOMATION_API_ENABLED=false`.
