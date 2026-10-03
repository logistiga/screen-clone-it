# LOGISTIGA MCP — Installation et connexion à ChatGPT

## 1. Architecture
```text
ChatGPT ──HTTPS (clé MCP)──> LOGISTIGA MCP Server (Node 22, Passenger, facturation.logistiga.pro/mcp-logistiga)
                                   │ HTTPS + Bearer LOGISTIGA_API_TOKEN (côté serveur uniquement)
                                   ▼
                          Laravel /api/gpt/* (lecture seule, liste blanche) → Services/Models → MySQL
```
Le serveur MCP n'accède jamais à MySQL. Il n'appelle que 7 chemins Laravel figés (liste blanche dans `src/services/logistiga-api.ts`).

## 2. Variables d'environnement (`~/mcp-logistiga/.env`, droits 600)
| Variable | Rôle |
|---|---|
| `LOGISTIGA_API_BASE_URL` | `https://facturation.logistiga.pro/backend/public/api/gpt` (HTTPS obligatoire en production) |
| `LOGISTIGA_API_TOKEN` | Token Laravel (= une valeur de `CHATGPT_API_TOKENS`). Jamais transmis au client. |
| `LOGISTIGA_API_TIMEOUT_MS` | Délai max d'un appel Laravel (défaut 15000) |
| `MCP_ACCESS_TOKENS` | Clés ChatGPT → MCP, séparées par des virgules (≥ 16 caractères) |
| `MCP_RATE_LIMIT` | Requêtes MCP / minute / clé (défaut 50, sous la limite Laravel de 60) |
| `MCP_BASE_PATH` | `/mcp-logistiga` |
| `MCP_PUBLIC_URL` | `https://facturation.logistiga.pro/mcp-logistiga` |
| `LOG_LEVEL` | `info` |

## 3. Déploiement
- Code : `~/mcp-logistiga` (hors dossier public). Seul `~/facturation/mcp-logistiga/.htaccess` (configuration Passenger, `RewriteEngine Off` en tête pour ne pas être capturé par la page React) est dans le dossier web.
- Application Node créée avec `cloudlinux-selector` (Node 22, mode production, démarrage `dist/server.js`). Passenger lance le processus à la demande et le relance automatiquement s'il s'arrête.
- Mise à jour :
  ```bash
  npm run build && npm test          # en local
  # envoyer dist/ package.json package-lock.json dans ~/mcp-logistiga
  cloudlinux-selector install-modules --json --interpreter nodejs --app-root mcp-logistiga
  cloudlinux-selector restart --json --interpreter nodejs --app-root mcp-logistiga
  ```
- `.env` et sources ne sont pas servis (`/mcp-logistiga/.env` → 404).

## 4. URL MCP publique
- Pour ChatGPT : `https://facturation.logistiga.pro/mcp-logistiga/k/<CLE_MCP>/mcp`
- Pour les clients qui envoient un header : `https://facturation.logistiga.pro/mcp-logistiga/mcp` + `Authorization: Bearer <CLE_MCP>`
- Health : `https://facturation.logistiga.pro/mcp-logistiga/health` → `{"status":"ok",...}` (n'appelle ni Laravel ni MySQL)

La clé MCP se lit sur le serveur : `cat ~/mcp_access_key.txt`.

## 5. Transport
MCP **Streamable HTTP** (SDK officiel `@modelcontextprotocol/sdk` 1.x), mode sans session (stateless), réponses JSON. Protocole négocié jusqu'à `2025-06-18`. Seul `POST` est accepté sur l'endpoint MCP.

## 6. Authentification ChatGPT → MCP
Clé statique révocable (`MCP_ACCESS_TOKENS`), acceptée de deux façons :
1. dans le chemin `/k/<clé>/mcp` : pour ChatGPT, dont l'écran de connexion propose seulement « OAuth » ou « Aucune authentification » ;
2. header `Authorization: Bearer <clé>` : pour les autres clients.
La logique est isolée dans `src/auth.ts` (interface `Authenticator`) : passer plus tard à OAuth ne change pas les outils.
Attention : en mode chemin, la clé fait partie de l'URL. Ne partagez l'URL qu'avec l'administrateur du connecteur.

## 7. Authentification MCP → Laravel
`Authorization: Bearer LOGISTIGA_API_TOKEN`, ajouté uniquement par `LogistigaApiClient`. Le token n'apparaît ni dans les réponses, ni dans les logs (masquage automatique), ni dans Git.

## 8. Outils
| Outil | Endpoint Laravel | Paramètres |
|---|---|---|
| `logistiga_get_schema` | GET `/schema` | aucun |
| `logistiga_search` | GET `/search` | `q` (2-100), `resources[]` facultatif |
| `logistiga_query` | POST `/query` | `resource`*, `filters[]`, `fields[]`, `relations[]`, `sort[]`, `limit` ≤ 200, `page`, `aggregations[]`, `group_by[]`, `period` |
| `logistiga_list_resource` | GET `/resources/{resource}` | `resource`*, `date_from`, `date_to`, `sort`, `limit`, `page` |
| `logistiga_client_summary` | GET `/clients/{id}/summary` | `client_id`* |
| `logistiga_unpaid_invoices` | GET `/factures/impayees` | `client_id`, `limit`, `page` |
| `logistiga_revenue` | GET `/stats/chiffre-affaires` | `date_from`, `date_to`, `period`, `client_id` |

Ressources : clients, factures, ordres, devis, paiements, caisse, notes_debut, conteneurs, annulations, banques, transitaires, representants, armateurs.

## 9. Exemples
- « Combien SIGALLI nous doit ? » → `logistiga_search {q:"SIGALLI", resources:["clients"]}` → `logistiga_unpaid_invoices {client_id:21}` (lire `meta.reste_a_payer_total`).
- « CA de septembre 2026 » → `logistiga_revenue {date_from:"2026-09-01", date_to:"2026-09-30"}` (réel : 180 factures, 251 846 877 FCFA TTC).
- « Devis par statut » → `logistiga_query {resource:"devis", group_by:["statut"], aggregations:[{fn:"count"}]}`.

## 10. Lecture seule
Aucun outil d'écriture, aucun outil générique (`execute`, `sql`, `http_request`...). Un outil inconnu est refusé. Laravel refuse aussi toute écriture (deuxième barrière).

## 11. Erreurs
Réponses `isError: true` avec `{"error":{"code","message"}}` ; codes : `AUTHENTICATION_FAILED`, `RESOURCE_NOT_ALLOWED`, `INVALID_FILTER`, `INVALID_ARGUMENT`, `NOT_FOUND`, `RATE_LIMITED`, `UPSTREAM_TIMEOUT`, `READ_ONLY`, `LOGISTIGA_API_ERROR`. Jamais de stack, de SQL, de chemin ni de secret.

## 12. Rotation des clés
- **Clé MCP** : ajouter la nouvelle dans `MCP_ACCESS_TOKENS=ancienne,nouvelle`, redémarrer (`cloudlinux-selector restart ...`), mettre à jour l'URL dans ChatGPT, retirer l'ancienne, redémarrer.
- **Token Laravel** : suivre la rotation de `backend/docs/CHATGPT_INTEGRATION.md`, puis mettre la nouvelle valeur dans `LOGISTIGA_API_TOKEN` et redémarrer.

## 13. Logs
JSON sur la sortie standard (journal Passenger) : `tool_call` (outil, ok, durée, taille), `upstream_call` (chemin, statut HTTP, durée, nombre de résultats), `mcp_request`, `mcp_auth_failed`. Les champs `authorization`, `token`, `x-api-key`, `secret`, `password` sont toujours masqués.

## 14. Dépannage
| Symptôme | Cause / action |
|---|---|
| `/health` renvoie la page React | `RewriteEngine Off` manquant en tête de `~/facturation/mcp-logistiga/.htaccess` |
| 403 « unable to read htaccess » | droits : `chmod 755 ~/facturation/mcp-logistiga && chmod 644 .../.htaccess` |
| `AUTHENTICATION_FAILED` dans les outils | `LOGISTIGA_API_TOKEN` absent ou différent de `CHATGPT_API_TOKENS` côté Laravel |
| 401 sur l'endpoint MCP | mauvaise clé MCP dans l'URL ou le header |
| `RATE_LIMITED` | attendre une minute ; ajuster `MCP_RATE_LIMIT` / `CHATGPT_API_RATE_LIMIT` |
| changement de `.env` sans effet | `cloudlinux-selector restart --json --interpreter nodejs --app-root mcp-logistiga` |

## 15. Connexion dans ChatGPT
1. ChatGPT → Settings → Apps & Connectors → Advanced → activer **Developer mode** (selon votre offre).
2. **Create** (nouveau connecteur) : nom `LOGISTIGA`, description « Données de facturation LOGISTIGA (lecture seule) ».
3. MCP Server URL : `https://facturation.logistiga.pro/mcp-logistiga/k/<CLE_MCP>/mcp`.
4. Authentication : **No authentication** (la clé est dans l'URL).
5. Cocher « I trust this application », créer, puis vérifier que les 7 outils apparaissent.
6. Dans une conversation, activer le connecteur et demander par exemple « Quel est notre chiffre d'affaires de septembre ? ».
