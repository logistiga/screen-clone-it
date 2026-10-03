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
