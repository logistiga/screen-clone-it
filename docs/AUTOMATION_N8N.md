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

POST /devis : mêmes champs que la création de devis (client_id, type_document Conteneur|Lot|Independant, lignes/conteneurs/lots, prix fournis — jamais inventés). Statut forcé `brouillon`. Réponse : numero, totaux arrondis FCFA, `url_validation`, `url_pdf` (page PDF téléchargeable, connexion LogistiGA requise). Même clé d'idempotence = même devis renvoyé (`meta.replay`).
Interdit : envoi client, conversion OT, facture, paiement, suppression.
Rotation : modifier `AUTOMATION_API_KEYS` (`nom:cle:perm1|perm2`, plusieurs séparés par virgule) puis `php artisan config:cache`. Coupure : `AUTOMATION_API_ENABLED=false`.

| GET | /clients/{id}/derniere-facture | factures:lire |
| POST | /factures/{id}/lien-pdf | factures:lire |

Dernière facture (hors annulées) : numero, dates, statut, montant_ttc, montant_paye, reste_du, `url_pdf` signé (24 h, sans connexion). Lecture seule.

## Consultations supplémentaires pour Mora (lecture seule)

Même clé `X-Automation-Key`, même enveloppe `{success, data, meta}`, montants FCFA entiers, `limit` défaut 20 / max 50 avec `meta.total`.
Impayés, retards et relevés excluent les factures `payee`, annulées et `brouillon`.

| Route | Permission | Paramètres |
|---|---|---|
| `GET /factures/{FAC-…}` | factures:lire | — (lignes, conteneurs, lots, reste_du, url_pdf) |
| `GET /clients/{id}/factures` | factures:lire | statut, date_debut, date_fin, limit |
| `GET /clients/{id}/releve` | factures:lire | date_debut, date_fin |
| `GET /factures/en-retard` | factures:lire | client_id, limit (meta.total_reste_du) |
| `GET /caisse/solde` | caisse:lire | — |
| `GET /caisse/mouvements` | caisse:lire | date_debut, date_fin, type=entree\|sortie, limit |
| `GET /dashboard/stats` | dashboard:lire | periode=jour\|semaine\|mois\|6mois\|annee |
| `GET /ordres/{OT-…}` | ordres:lire | — |
| `GET /clients/{id}/ordres` | ordres:lire | statut, limit |
| `GET /devis/{DEV-…}` | devis:lire | — (lignes + url_pdf) |
| `GET /clients/{id}/devis` | devis:lire | statut, limit |
| `GET /clients/{id}` | clients:lire | — |

Erreurs : 401 `UNAUTHENTICATED` (clé absente), 404 `NOT_FOUND`, 422 `VALIDATION` (période/dates invalides).
