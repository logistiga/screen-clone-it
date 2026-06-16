# Plan — Module "Opération" Logistiga (intégration Facturation)

Objectif : implémenter dans l'app Facturation un module **Opération** strictement aligné sur la spec Logistiga v1.0, permettant la création bidirectionnelle Facture ↔ Opération avec les mêmes colonnes, énums, unités (entiers FCFA) et règles de calcul.

> ⚠️ Ce chantier est **gros** (≈ 25 migrations, 9 modèles, 6+ controllers, 10+ écrans React). Je propose de le livrer en **4 lots** indépendants et testables. Chaque lot se termine par `php artisan migrate` + smoke test.

---

## Lot 1 — Schéma BDD miroir + modèles + énums (fondations)

### Backend — migrations (toutes en UUID, FCFA `unsignedBigInteger`, softDeletes)
1. `create_operations_table` — entête + `numero_operation` unique `OP-YYYYMM-####`
2. `create_operation_lines_table` — pivot polymorphe (`line_type`, `line_id`, `position` unique par op)
3. `create_transport_operation_lines_table`
4. `create_location_operation_lines_table`
5. `create_manutention_operation_lines_table`
6. `create_autre_operation_lines_table`
7. `create_operation_charges_table` (source: `auto_transport` | `manual`)
8. `create_operation_payments_table`
9. `create_operation_bonuses_table` (prime/commission + validation)
10. `add_operation_link_to_factures` — `operation_id uuid NULL`, `operation_numero varchar(30) NULL` + index

### Backend — modèles
- `Operation`, `OperationLine` (morphTo `line`), `TransportOperationLine`, `LocationOperationLine`, `ManutentionOperationLine`, `AutreOperationLine`, `OperationCharge`, `OperationPayment`, `OperationBonus`
- Tous avec `HasUuids`, `SoftDeletes`, `$fillable`, casts (`date`, entiers)
- Observer `OperationObserver` pour recalcul `total_transport_fcfa` (via Eloquent Observer — conforme mémoire projet)

### Frontend — types
- `src/types/operations/` : `operation.ts`, `operationLine.ts`, `transportOperation.ts`, `locationOperation.ts`, `manutentionOperation.ts`, `autreOperation.ts`, `operationCharge.ts`, `operationPayment.ts`, `operationBonus.ts`, `enums.ts` (section 5 de la spec copiée verbatim)

**Critère de sortie** : `php artisan migrate` passe, tables créées avec bons types/index, modèles instanciables en tinker.

---

## Lot 2 — Services de calcul + API REST `/api/v1/operations`

### Backend — services (source de vérité calculs)
- `App\Services\Operations\TransportOperationCalculationService`
  - `total_ligne = max(0, prix) * max(1, qte)`
  - LOCATION : `nombre_jours = (date_fin - date_debut) + 1` puis `* prix_jour`
  - `total_transport = Σ operation_lines.total_ligne_fcfa`
  - **Toujours recalculé dans une transaction côté back** (jamais confiance au front)
- `OperationNumberService` — séquence mensuelle `OP-YYYYMM-####` (lock pessimiste)
- `OperationLineDispatcher` — crée la bonne sous-table selon `type`
- `CreateOperationAction` — orchestration transactionnelle

### Backend — controllers / requests / resources
- `Api\V1\Operations\OperationController` (index, show, store, destroy)
- `Api\V1\Operations\OperationChargeController` (+ endpoint `auto-transport` idempotent)
- `Api\V1\Operations\OperationPaymentController`
- `Api\V1\Operations\OperationBonusController`
- FormRequests : `StoreOperationRequest`, `StoreChargeRequest`, `StorePaymentRequest`, `StoreBonusRequest` (validation énums section 5)
- Resources : `OperationResource`, `OperationLineResource`, `TransportOperationLineResource`, etc. — forme exacte section 6.5, avec `whenLoaded` + null checks (conforme mémoire)
- Routes dans nouveau fichier `backend/routes/api_operations.php` chargé depuis `api.php` (conforme mémoire modular API routing)
- Permissions Spatie : `operations.manage`, `operations.delete`

### Frontend — couche API
- `src/lib/api/operations/` : `operationsApi.ts`, `chargesApi.ts`, `paymentsApi.ts`, `bonusesApi.ts`
- Utilisation `api-normalize.ts` (conforme mémoire)

**Critère de sortie** : Postman/curl POST `/api/v1/operations` avec payload section 6.4 → réponse 201 conforme section 6.5, totaux corrects.

---

## Lot 3 — UI Frontend (liste, création, détail)

Structure (conforme limite 300 lignes/fichier, mémoire projet) :

```
src/pages/operations/
  OperationsList.tsx
  OperationCreate.tsx
  OperationDetail.tsx
  OperationEdit.tsx
src/components/operations/v2/
  OperationGeneralInfo.tsx        (date, client autocomplete, marchandise)
  OperationLinesTable.tsx         (table + bouton + ligne)
  LineFormDialog.tsx              (dispatcher par type via lineTypeRegistry)
  forms/
    TransportLineForm.tsx         (point_depart, point_arrivee, type_transport, mode_trajet, qte, prix)
    LocationLineForm.tsx          (tariff, date_debut, date_fin, jours auto, prix/jour)
    ManutentionLineForm.tsx       (tariff, libelle, qte, prix_unitaire)
    AutreLineForm.tsx             (description, qte, prix_unitaire)
  tabs/
    OperationChargesTab.tsx       (auto-transport + manuel)
    OperationPaymentsTab.tsx
    OperationBonusesTab.tsx
  OperationSummary.tsx            (total transport / charges / payé / reste)
  lineTypeRegistry.ts             (mapping LineType → composant form)
  format.ts                       (formatFCFA entier)
```

- Hooks : `useAutoOperationCharges`, `useAutoOperationBonuses`
- Routing : ajouter routes `/operations`, `/operations/nouvelle`, `/operations/:id`, `/operations/:id/modifier` dans `App.tsx`
- Sidebar : entrée "Opérations" dans `AppSidebar.tsx`
- Réutiliser autocomplete client existant (`external_client_id` = `clients.id` côté Facturation)

**Critère de sortie** : Créer une opération complète (4 types de lignes) depuis l'UI, voir le détail, ajouter charge/paiement/prime.

---

## Lot 4 — Lien bidirectionnel Facture ↔ Opération + Webhooks HMAC

### Backend
- Endpoint `POST /api/v1/factures/from-operation` (body `{operation_id}`) :
  - Lit l'opération locale (ou via service HTTP si externe — voir env)
  - Crée la facture catégorie "Opérations indépendantes" en copiant ligne par ligne (`position`, `line_type`, champs typés, `total_ligne_fcfa`)
  - Set `factures.operation_id` + `operation_numero`
- Middleware `VerifyHmacSignature` (header `X-Signature: sha256=<hex>`, body brut, `hash_equals`)
- Routes webhook `/api/v1/webhooks/invoice-created|validated|paid` et `/operation-created|deleted`
- Events Laravel + Listeners émettant les webhooks vers `LOGISTIGA_API_URL` signés avec `WEBHOOK_SHARED_SECRET`
- Endpoint `GET /api/v1/external-clients` exposant `{id, name, type, phone, email}` (Logistiga lit cette base)

### Frontend
- Bouton "Générer la facture" sur `OperationDetail` → appelle `from-operation` puis redirige
- Bouton "Voir l'opération liée" sur `FactureDetail` si `operation_id` présent
- Bandeau "Cette facture est liée à l'opération OP-YYYYMM-####"

### Secrets à ajouter (via outil secrets, après confirmation utilisateur)
- `LOGISTIGA_API_URL`
- `LOGISTIGA_SERVICE_TOKEN`
- `WEBHOOK_SHARED_SECRET` (≥ 32 chars)

**Critère de sortie** : Créer opération → générer facture → `total_transport_fcfa` identique des deux côtés, webhook reçu signé OK.

---

## Points d'attention / décisions à confirmer avant Lot 1

1. **Coexistence avec l'existant** : le projet a déjà un module "Opérations indépendantes" intégré dans `lignes_ordres/devis/factures` (modal `LigneModal`, factory `OperationIndependanteFactory`). La spec demande un **nouveau modèle parallèle** (`operations` + tables typées dédiées, FCFA entiers, UUID). → Je propose de **garder l'ancien intact** (rétrocompat lecture) et de bâtir le nouveau module en parallèle sous le namespace `Operations\V2` / route `/api/v1/operations`. À terme migration des données existantes (hors scope).

2. **Unités FCFA entières** : conflit avec la convention actuelle du projet qui stocke en `decimal` arrondi. Pour le nouveau module on respecte la spec (`unsignedBigInteger`). Le mapping vers `factures.lignes_factures.montant_ht` (decimal) se fait au moment de `from-operation`.

3. **Tables `destinations` et `location_tariffs`** : référencées par FK dans transport/location/manutention. Existent-elles déjà ? Sinon il faut les créer ou nuller les FK. → À confirmer.

4. **Direction par défaut** : Implémenter d'abord **A — création depuis Opération puis bouton "Générer facture"** (recommandé par la spec). La direction B (Facturation → Logistiga distant) viendra plus tard si besoin.

---

## Estimation
- Lot 1 : ~10 migrations + 9 modèles + types TS → 1 session
- Lot 2 : services + 4 controllers + resources + routes → 1-2 sessions
- Lot 3 : ~15 composants React + routing → 2 sessions
- Lot 4 : webhooks + bridge facture + secrets → 1 session

**Total : 5-6 sessions de build.**

---

### Questions avant de démarrer
- ✅ OK pour démarrer par le **Lot 1** (schéma + modèles + types) ?
- Les tables `destinations` et `location_tariffs` existent-elles déjà côté Facturation, ou faut-il les créer (champs, énums) ?
- Garder l'ancien module "Opérations indépendantes" en lecture seule, ou le remplacer ?
