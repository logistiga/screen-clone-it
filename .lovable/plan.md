
# Refonte "Opérations Indépendantes" + Sync OT → App Opérations

## Objectif
Refondre proprement la création de Devis / Ordre de Travail / Facture pour les opérations indépendantes avec 6 types de lignes typées, et pousser automatiquement chaque OT créé/maj vers l'app Opérations Logistiga via webhook HMAC. L'opérateur n'aura plus qu'à cliquer "Valider" côté Ops (aucun retour vers Facturation).

## 1. Modèle de données (backend Laravel)

Migrations additives (pas de table polymorphique séparée, on étend l'existant).

Sur `lignes_devis`, `lignes_ordres`, `lignes_factures` :
- `line_type` enum: `TRANSPORT | LOCATION | MANUTENTION | AUTRE | DOUBLE_RELEVAGE | STOCKAGE`
- `position` integer (ordre d'affichage)
- `libelle` string nullable (titre court de la ligne)
- `type_transport` string nullable (camion / porte-char / etc.)
- `mode_trajet` enum nullable (`aller_simple | aller_retour`)
- `nombre_jours` integer nullable (calculé pour LOCATION/STOCKAGE à partir de dates)
- `date_debut`, `date_fin` date nullable (LOCATION/STOCKAGE)
- Montants restent `decimal(15,2)`, IDs restent `bigint` (pas d'UUID, pas de bigint FCFA).

Backfill : commande `lignes:backfill-line-type` qui mappe l'ancien `type_operation_indep` + `type_operation` vers `line_type`, calcule `nombre_jours` pour location/stockage, et numérote `position` via `ROW_NUMBER()`.

Nouvelle table `ops_webhook_deliveries` (audit des envois) :
- `id`, `ordre_id`, `event` (created/updated/deleted), `payload_json`, `signature`, `attempts`, `last_status`, `last_response`, `next_retry_at`, timestamps.

## 2. Backend services

- `LineTypeRegistry` (PHP) : définit les 6 types, leurs champs requis et leur libellé par défaut.
- `AutreService` : nouveau, gère libellé libre.
- `LocationService` / `StockageService` : recalcul auto `nombre_jours = date_fin - date_debut + 1`.
- `TransportService` : prend en compte `type_transport` + `mode_trajet` (aller_retour double la quantité par défaut).
- Form requests (`StoreDevisRequest`, `StoreOrdreRequest`, `StoreFactureRequest`) : `lignes.*.line_type` requis, validations conditionnelles `required_if`.
- Resources : exposent toutes les nouvelles colonnes.

## 3. Sync OT → App Opérations (Push webhook)

- Observer `OrdreTravailObserver` (créé / mis à jour / supprimé pour OT catégorie "opérations indépendantes" uniquement) → dispatch job `SendOpsWebhookJob`.
- `SendOpsWebhookJob` (queue) :
  - Construit payload JSON normalisé : header OT + lignes typées + client + montants.
  - Signe `X-Logistiga-Signature: sha256=HMAC(payload, OPS_WEBHOOK_SECRET)`.
  - POST vers `OPS_WEBHOOK_URL`.
  - Retries exponentiels (1m, 5m, 30m, 2h, 6h — 5 tentatives), log dans `ops_webhook_deliveries`.
- Endpoint admin `/admin/ops-webhooks` côté Facturation : liste les livraisons, replay manuel sur échec.
- **One-way** : aucun endpoint inbound, aucun champ `valide_ops` côté Facturation (conformément au choix utilisateur).

**Secrets à demander** une fois le plan validé :
- `OPS_WEBHOOK_URL` (URL de réception côté app Ops)
- `OPS_WEBHOOK_SECRET` (secret HMAC partagé)

## 4. Frontend

- `src/lib/api/commercial/types.ts` : nouveau type unifié `LigneApi` avec tous les champs typés.
- `src/lib/commercial/LineTypeRegistry.ts` : miroir front (libellés, champs visibles par type, validations Zod).
- `src/components/commercial/operations-independantes/` :
  - `OperationsIndependantesForm.tsx` (partagé Devis / OT / Facture).
  - `LineFormDialog.tsx` (form modal contextuel selon `line_type`).
  - `TransportFormFields.tsx` étendu (`type_transport`, `mode_trajet`).
  - `LocationFormFields.tsx` / `StockageFormFields.tsx` (date_debut/date_fin → auto nombre_jours).
  - `ManutentionFormFields.tsx`, `DoubleRelevageFormFields.tsx`, `AutreFormFields.tsx` (libellé libre).
- Intégration dans `DevisForm`, `OrdreTravailForm`, `FactureForm` (pages opérations indépendantes uniquement, autres catégories inchangées).
- `toApiPayload()` simplifié — un seul mapping basé sur `line_type`.

## 5. Affichage PDF

- `buildLignesIndependant()` enrichi : rend la ligne selon `line_type` (icône + libellé typé, jours pour location/stockage, mode trajet pour transport, libellé libre pour autre).
- Pas de changement de modèle PDF (toujours "Opérations Indépendantes"), seulement le contenu des lignes.

## 6. Migration & non-régression

- Backfill exécuté en prod après déploiement.
- Anciens OT/Devis/Factures ouverts en lecture : `line_type` rempli par backfill, comportement identique.
- Tests manuels :
  1. Créer Devis avec une ligne de chaque type → convertir en OT → convertir en Facture → vérifier PDF.
  2. Modifier OT → vérifier ré-envoi webhook (event `updated`).
  3. Couper l'app Ops → vérifier retries dans `ops_webhook_deliveries`.

## Hors scope (explicitement)
- Pas de table polymorphique séparée (`operations` / `operation_lines`).
- Pas de migration UUID, pas de bigint FCFA.
- Pas de retour de validation Ops → Facturation (one-way confirmé).
- Pas de `/api/v1`, pas d'`operation_charges` / `payments` / `bonuses`.

## Détails techniques (section dev)

- Enum PG `line_type_enum` créé via migration, ajouté aux 3 tables.
- HMAC : `hash_hmac('sha256', $rawJson, $secret)`.
- Job queue : connexion `database` (déjà utilisée par le projet), tag `ops-webhook`.
- Observer filtre : `if ($ordre->categorie !== 'operations_independantes') return;`.
- Front : `LigneApi.discriminatedUnion('line_type', [...])` côté Zod pour validation typée.

## Livraison
Tout en un seul plan (backend migrations + services + webhook + frontend + PDF) comme demandé.

Prochaine étape après approbation : je demande les 2 secrets (`OPS_WEBHOOK_URL`, `OPS_WEBHOOK_SECRET`) puis j'implémente.
