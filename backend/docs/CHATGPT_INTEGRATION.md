# Intégration ChatGPT — LogistiGA

## Architecture
ChatGPT (Custom GPT / Action) → HTTPS + Bearer → Laravel `/api/gpt/*` (middleware `ChatGptAuth`) → `QueryEngine` (liste blanche `ResourceRegistry`) → Models Eloquent → MySQL.
ChatGPT n'accède jamais à MySQL. Aucun SQL fourni par le client n'est exécuté.

> Préfixe `/api/gpt` (et non `/api/ai`) : `/api/ai` est déjà utilisé par l'Assistant IA interne (session utilisateur).

## URL de base
- Production : `https://facturation.logistiga.pro/backend/public/api/gpt`
- Test local : `http://localhost:8000/api/gpt`
- Spécification : `https://facturation.logistiga.pro/backend/public/chatgpt/openapi.yaml`

## Authentification
Header `Authorization: Bearer <token>`. Les tokens valides sont dans `.env` du serveur (jamais dans Git) :
```
CHATGPT_API_TOKENS=token1,token2
CHATGPT_API_RATE_LIMIT=60
CHATGPT_API_ENABLED=true
```
Générer un token : `openssl rand -hex 32`.

### Rotation / révocation
1. Ajouter le nouveau token : `CHATGPT_API_TOKENS=ancien,nouveau` puis `php artisan config:clear`.
2. Mettre le nouveau token dans l'Action ChatGPT.
3. Retirer l'ancien de la liste, `php artisan config:clear`.
Coupure d'urgence : `CHATGPT_API_ENABLED=false`.

## Sécurité
- Lecture seule : toute méthode autre que GET est refusée (405), sauf `POST /query` (lecture).
- Liste blanche des ressources, champs, relations, opérateurs, agrégations.
- Champs sensibles jamais exposés : mots de passe, tokens, IBAN/RIB, notes et observations internes, `token_verification`.
- Valeurs toujours liées (pas d'injection SQL). `like` échappe `%` et `_`.
- Limites : 200 lignes max par page, 10 résultats par ressource en recherche, 60 requêtes/min par token.
- Journal : canal `daily` (`storage/logs/laravel-*.log`, message `chatgpt_api`) : endpoint, empreinte du token (jamais le token), ressource, statut, durée, nombre de résultats.

## Endpoints
| Méthode | Chemin | Usage |
|---|---|---|
| GET | `/schema` | Ressources, champs, filtres |
| GET | `/search?q=` | Recherche transversale |
| POST | `/query` | Requête structurée + agrégations |
| GET | `/resources/{resource}` | Liste simple |
| GET | `/clients/{id}/summary` | Résumé client |
| GET | `/factures/impayees` | Impayés |
| GET | `/stats/chiffre-affaires` | CA par période |

Ressources : clients, factures, ordres, devis, paiements, caisse, notes_debut, conteneurs, annulations, banques, transitaires, representants, armateurs.

## Exemples
CA 2026 d'un client par mois :
```json
POST /query
{"resource":"factures","filters":[{"field":"client_id","value":12},{"field":"date_creation","op":"between","value":["2026-01-01","2026-12-31"]},{"field":"statut","op":"neq","value":"annulee"}],"period":"month","aggregations":[{"fn":"sum","field":"montant_ttc"},{"fn":"count"}]}
```
Devis en attente :
```json
{"resource":"devis","filters":[{"field":"statut","op":"in","value":["brouillon","envoye"]}],"relations":["client"]}
```

## Configuration du Custom GPT
1. ChatGPT → Explore GPTs → Create → Configure → Actions → Create new action.
2. Import from URL : l'URL de `openapi.yaml` ci-dessus.
3. Authentication : API Key → Bearer → coller le token.
4. Instructions conseillées : « Appelle d'abord getSchema. Utilise les agrégations pour les totaux au lieu de lister les lignes. Montants en FCFA. »

## Phase 2 (écriture)
Non activée. Prévoir : routes séparées, permissions par token, confirmation explicite, journal dans la base.

---

## MCP / ChatGPT Custom App readiness

L'API est **indépendante du client** : rien n'est spécifique à ChatGPT. Elle peut être consommée par un Custom GPT (OpenAPI), une future couche MCP, un script ou un autre outil.

```text
MySQL → Models/Services Laravel → API /api/gpt/* (token, lecture seule) → OpenAPI et/ou serveur MCP → ChatGPT / Claude / autre
```

Aucun serveur MCP n'existe encore dans le projet. La couche MCP sera un simple **adaptateur fin** : chaque outil MCP appelle un endpoint ci-dessous avec le token machine, et renvoie le JSON tel quel.

### Base URL Laravel
- Production : `https://facturation.logistiga.pro/backend/public/api/gpt`
- OpenAPI : `https://facturation.logistiga.pro/backend/public/chatgpt/openapi.yaml`

### Authentification (machine-to-machine)
- `Authorization: Bearer <token>` (recommandé). Repli accepté : header `X-Api-Key: <token>` (utile si un proxy retire `Authorization`).
- Aucun compte utilisateur, aucune session, aucun cookie, aucun CSRF.
- Token stocké côté serveur dans `.env` → `CHATGPT_API_TOKENS` ; côté MCP, dans un secret de la plateforme qui héberge l'adaptateur. Jamais dans Git.

### Endpoints et outils MCP suggérés
| operationId | Méthode / chemin | Outil MCP suggéré | Usage |
|---|---|---|---|
| `getSchema` | GET `/schema` | `logistiga_schema` | Ressources, champs, filtres, agrégations |
| `search` | GET `/search?q=&resources=` | `logistiga_search` | Recherche transversale |
| `query` | POST `/query` | `logistiga_query` | Requête structurée + agrégations |
| `listResource` | GET `/resources/{resource}` | `logistiga_list` | Liste simple paginée |
| `clientSummary` | GET `/clients/{id}/summary` | `logistiga_client_summary` | Résumé d'un client |
| `unpaidInvoices` | GET `/factures/impayees` | `logistiga_unpaid_invoices` | Factures non soldées |
| `revenue` | GET `/stats/chiffre-affaires` | `logistiga_revenue` | CA par période |

Tous les outils sont en lecture seule (`readOnlyHint: true`, `idempotentHint: true`).

### Ressources disponibles
`clients`, `factures`, `ordres`, `devis`, `paiements`, `caisse`, `notes_debut`, `conteneurs`, `annulations`, `banques`, `transitaires`, `representants`, `armateurs`.
La liste exacte des champs (filtrée selon les colonnes réelles de la base) est renvoyée par `GET /schema`.

### Schémas JSON
Succès :
```json
{ "success": true, "data": [ ... ] | { ... }, "meta": { "page": 1, "limit": 50, "total": 454 } }
```
Erreur :
```json
{ "success": false, "error": { "code": "INVALID_FIELD", "message": "..." } }
```
Codes d'erreur stables : `UNAUTHENTICATED` (401), `READ_ONLY` (405), `RATE_LIMITED` (429), `DISABLED` (503), `INVALID_RESOURCE` (404), `NOT_FOUND` (404), `INVALID_FIELD`, `INVALID_FILTER`, `INVALID_RELATION`, `INVALID_AGGREGATION`, `INVALID_PERIOD`, `INVALID_QUERY`, `QUERY_FAILED` (422).

Corps de `POST /query` :
```json
{
  "resource": "factures",
  "filters": [{ "field": "string", "op": "eq|neq|gt|gte|lt|lte|like|in|between|null|not_null", "value": "any" }],
  "fields": ["string"], "relations": ["client"], "sort": ["-date_creation"],
  "limit": 50, "page": 1,
  "aggregations": [{ "fn": "count|sum|avg|min|max", "field": "montant_ttc" }],
  "group_by": ["statut"], "period": "day|month|year"
}
```

### Exemples de requêtes et réponses (données réelles, octobre 2026)
```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/stats/chiffre-affaires?date_from=2026-01-01&date_to=2026-10-03"
```
```json
{"success":true,"data":[{"periode":"2026-01","count_id":148,"sum_montant_ht":70890997,"sum_montant_ttc":84334358,"sum_montant_paye":67767797}],"meta":{"resource":"factures","date_from":"2026-01-01","date_to":"2026-10-03"}}
```
```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/factures/impayees?limit=1"
```
```json
{"success":true,"data":[{"id":238,"numero":"FAC-2026-0238","client_id":202,"montant_ttc":"136850.00","montant_paye":"0.00","statut":"brouillon","client":{"id":202,"nom":"TMT"}}],"meta":{"page":1,"limit":1,"total":454,"reste_a_payer_total":481576697}}
```
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"resource":"devis","group_by":["statut"],"aggregations":[{"fn":"count"},{"fn":"sum","field":"montant_ttc"}]}' "$BASE/query"
```
```json
{"success":true,"data":[{"statut":"brouillon","count_id":16,"sum_montant_ttc":95592846},{"statut":"converti","count_id":12,"sum_montant_ttc":49516633}],"meta":{"groups":2,"resource":"devis"}}
```

### Restrictions
- Lecture seule stricte : seules GET et `POST /query` sont acceptées.
- Liste blanche des ressources, champs, relations, opérateurs ; aucun SQL accepté.
- Jamais exposés : mots de passe, tokens, IBAN/RIB, notes et observations internes.
- Montants en FCFA ; agrégats arrondis à l'entier ; les montants des lignes sont des chaînes décimales.
- Dates ISO 8601.

### Rate limits et volumes
- 60 requêtes / minute par token (`CHATGPT_API_RATE_LIMIT`), plus la limite globale de l'API.
- 200 lignes max par page (50 par défaut), 10 résultats par ressource en recherche, 500 groupes max en agrégation, 200 valeurs max pour `in`.

### Rotation du token
1. `openssl rand -hex 32` → nouveau token.
2. Serveur : `CHATGPT_API_TOKENS=ancien,nouveau` puis `php artisan config:clear` (les deux sont valides).
3. Mettre le nouveau token dans le Custom GPT et/ou le secret de l'adaptateur MCP.
4. Retirer l'ancien, `php artisan config:clear`. Coupure immédiate : `CHATGPT_API_ENABLED=false`.
Chaque token a sa propre empreinte dans le journal et son propre compteur de débit : un token par client (Custom GPT, MCP, etc.) est conseillé.

---

## CHATGPT CONNECTOR HANDOFF
- **Base URL** : `https://facturation.logistiga.pro/backend/public/api/gpt`
- **OpenAPI** : `https://facturation.logistiga.pro/backend/public/chatgpt/openapi.yaml`
- **Auth** : Bearer token (repli `X-Api-Key`), token sur le serveur dans `~/chatgpt_token.txt` (lecture : `cat ~/chatgpt_token.txt`).
- **Custom GPT** : Actions → Import from URL (OpenAPI) → Authentication API Key / Bearer.
- **Futur MCP** : 7 outils lecture seule mappés 1:1 sur les operationId ci-dessus ; token dans un secret de l'hébergeur MCP.
- **Vérifié en production** : schéma, recherche, requête, agrégations, impayés, CA, refus sans token, refus d'un champ interdit, refus d'écriture.
- **Non fait** : serveur MCP (aucune infrastructure existante), tests automatiques non lancés (pas d'environnement de test sur le serveur).
