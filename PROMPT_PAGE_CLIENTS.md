# 🎯 PROMPT LOVABLE — MODULE CLIENTS COMPLET (Frontend + Backend)

> Copie-colle ce prompt **tel quel** dans le projet `logistiga-v2`.
> Le module Clients doit être livré **100% fonctionnel, front + back synchronisés**, en respectant les **Règles Maîtres du projet** déjà enregistrées en mémoire.

---

## 📌 CONTEXTE

Tu dois créer le **module CLIENTS complet** de l'application LogistiGA v2.
Stack : **React 18 + Vite + TS strict + Tailwind + shadcn/ui** (front) et **Laravel 11 + Sanctum + MySQL** (back).
Architecture déjà en place : `src/services/api`, `src/hooks`, `src/pages`, `src/components/clients`, `backend/app/Http/Controllers/Api`, `backend/app/Models`, `backend/app/Policies`, `backend/database/migrations`.

⚠️ **Règles obligatoires (déjà en mémoire) :**
- Max **300 lignes / fichier** (front + back) → découper sinon.
- **Aucun `fetch`/`axios` dans les composants** → tout via `src/services/api/clients.ts`.
- **TS strict**, pas de `any`.
- Backend = source de vérité : validation + permissions + sécurité côté Laravel.
- Pas de secrets ni d'URL hardcodés.
- Synchronisation front ↔ back garantie.
- Livrer un **rapport final** (fichiers créés/modifiés/supprimés, refacto, infra, risques).

---

## 🗄️ 1. BACKEND (Laravel)

### 1.1 Migration `clients`
Table `clients` avec colonnes :
- `id` (bigint, PK)
- `nom` (string 255, **required**, indexé)
- `email` (string 255, nullable, indexé)
- `telephone` (string 50, nullable)
- `adresse` (text, nullable)
- `ville` (string 255, nullable, indexé)
- `pays` (string 100, nullable, default `'Cameroun'`)
- `type` (enum `Particulier|Entreprise`, **required**)
- `rccm` (string 100, nullable)
- `nif` (string 100, nullable)
- `contact_principal` (string 255, nullable)
- `solde` (decimal 15,2, default 0) — calculé/agrégé
- `limite_credit` (decimal 15,2, default 0)
- `notes` (text, nullable)
- `timestamps()` + `softDeletes()`
- Index composites : `(nom, ville)`, `(type)`.

### 1.2 Migration `contacts` (multi-contacts par client)
- `id`, `client_id` (FK cascade), `nom`, `fonction`, `email`, `telephone`, `est_principal` (bool), `notes`, `timestamps`.
- Index `(client_id, est_principal)`.

### 1.3 Model `Client`
- `HasFactory`, `SoftDeletes`.
- `$fillable` complet, `$casts` (`solde` decimal:2, `limite_credit` decimal:2).
- Relations : `devis()`, `ordresTravail()`, `factures()`, `paiements()`, `annulations()`, `avoirsDisponibles()`, `contacts()`, `contactPrincipal()`.
- Accessor `solde_avoirs` (somme `solde_avoir` annulations actives).

### 1.4 Model `Contact`
- Relation inverse `client()`.

### 1.5 FormRequests
- `StoreClientRequest` et `UpdateClientRequest` :
  - `nom` required string max 255
  - `email` nullable email max 255
  - `telephone` nullable string max 50
  - `adresse` nullable string max 1000
  - `ville`, `pays`, `rccm`, `nif`, `contact_principal` nullable
  - `type` required in `Particulier,Entreprise`
  - `limite_credit` nullable numeric min 0
  - `notes` nullable max 5000
  - `contacts` nullable array + `contacts.*.nom` required_with:contacts, email, telephone, est_principal, fonction, notes.
- Messages d'erreur **en français**.

### 1.6 Resource `ClientResource`
Retour JSON avec : champs du model + `solde` (number), `solde_avoirs` (number), `nb_factures`, `nb_factures_impayees`, `nb_ordres_actifs`, `ca_total`, `dernier_paiement_at`, `contacts` (via `ContactResource`, `whenLoaded`), `created_at`, `updated_at`.
- Tous les nombres arrondis à l'entier pour XAF (`round($value)`).
- Closures null-safe (`whenLoaded`, `??` defaults).

### 1.7 Policy `ClientPolicy`
- `viewAny` → `clients.voir`
- `view` → `clients.voir`
- `create` → `clients.creer`
- `update` → `clients.modifier`
- `delete` → `clients.supprimer`
- Enregistrée dans `AuthServiceProvider`.

### 1.8 Permissions (seeder)
Ajouter dans `RolesAndPermissionsSeeder` : `clients.voir`, `clients.creer`, `clients.modifier`, `clients.supprimer`, `clients.exporter`.
Attribuées aux rôles : Admin (toutes), Commercial (voir/créer/modifier), Comptable (voir).

### 1.9 Controller `ClientController`
Méthodes :
- `index(Request)` :
  - Recherche `q` (nom, email, telephone, ville, rccm, nif) — **LIKE insensible**.
  - Filtres : `type`, `ville`, `with_balance` (solde>0), `with_avoirs`, `no_balance`.
  - Tri : `sort_by` (`nom|created_at|solde|ca_total`) + `sort_dir`.
  - Pagination : `per_page` (default 20, max 100).
  - `with(['contactPrincipal'])` + agrégats via `withCount` / `selectSub` (PAS de N+1).
  - Retour paginé via `ClientResource::collection(...)`.
- `store(StoreClientRequest)` : DB transaction → création client + contacts. Retour 201 + Resource.
- `show(Client)` : eager load `contacts`, `factures` (5 récentes), `paiements` (5 récents), `avoirsDisponibles`.
- `update(UpdateClientRequest, Client)` : DB transaction → update client + sync contacts (delete missing, upsert).
- `destroy(Client)` :
  - **Bloquer** si factures non payées ou ordres actifs → 422 message clair.
  - Sinon soft delete.
- `stats(Client)` : CA total, nb docs par type, encours, dernier paiement, ancienneté.
- `globalStats()` : nb total clients, actifs (avec doc < 90j), inactifs, top 5 par CA, répartition par ville.
- Tous les `catch(\Throwable $e)` → 422 JSON avec `message` + `errors` (jamais 500).
- Headers JSON `JSON_INVALID_UTF8_SUBSTITUTE`.
- `authorize` via Policy sur chaque méthode.

### 1.10 Observer `ClientObserver`
- `created` → dispatch `ClientCreated` event (déjà existant).
- `deleted` → invalider cache dashboard.
- Enregistré dans `AppServiceProvider`.

### 1.11 Routes `routes/api_clients.php`
Préfixe `clients`, middleware `audit` + `auth:sanctum` + permissions :
```
GET    /clients               clients.voir
GET    /clients/stats         clients.voir + throttle:stats
POST   /clients               clients.creer
GET    /clients/{client}      clients.voir
PUT    /clients/{client}      clients.modifier
DELETE /clients/{client}      clients.supprimer
GET    /clients/{client}/stats clients.voir + throttle:stats
```
Inclure dans `routes/api.php`.

### 1.12 Tests Feature (PHPUnit)
- `ClientCrudTest` : index/store/show/update/destroy + permissions.
- `ClientValidationTest` : champs requis, email invalide, type invalide.
- `ClientDeleteGuardTest` : refus si factures impayées.

---

## 🎨 2. FRONTEND (React + TS)

### 2.1 Types `src/types/clients.ts`
```ts
export type ClientType = 'Particulier' | 'Entreprise';
export interface Contact { id?: number; nom: string; fonction?: string; email?: string; telephone?: string; est_principal?: boolean; notes?: string; }
export interface Client {
  id: number; nom: string; email?: string; telephone?: string;
  adresse?: string; ville?: string; pays?: string;
  type: ClientType; rccm?: string; nif?: string;
  contact_principal?: string;
  solde: number; solde_avoirs: number; limite_credit: number;
  nb_factures: number; nb_factures_impayees: number; nb_ordres_actifs: number;
  ca_total: number; dernier_paiement_at?: string | null;
  notes?: string; contacts?: Contact[];
  created_at: string; updated_at: string;
}
export interface ClientFilters { q?: string; type?: ClientType; ville?: string; status?: 'all'|'with_balance'|'no_balance'|'with_avoirs'; sort_by?: string; sort_dir?: 'asc'|'desc'; page?: number; per_page?: number; }
export interface Paginated<T> { data: T[]; meta: { current_page: number; last_page: number; per_page: number; total: number; }; }
```

### 2.2 Service API `src/services/api/clients.ts`
- Centralise **tous** les appels via l'axios partagé (`src/services/api/http.ts`).
- Méthodes : `list(filters)`, `get(id)`, `create(payload)`, `update(id, payload)`, `remove(id)`, `stats(id)`, `globalStats()`, `exportPdf(filters)`, `exportExcel(filters)`, `exportCsv(filters)`.
- Gère 401/403/419/422/429/500 (interceptor global) ; renvoie typed responses.

### 2.3 Hooks `src/hooks/clients/`
- `useClientsList.ts` (React Query) : `useQuery(['clients', filters], …)`, debounce 300 ms côté `useDebounce`.
- `useClient.ts` : `useQuery(['client', id])`.
- `useClientMutations.ts` : `useMutation` create/update/delete + invalidations propres.
- `useClientStats.ts` : `useQuery(['client-stats', id])`.
- `useGlobalClientStats.ts` : `useQuery(['clients-stats'])`.
- `index.ts` barrel export.

### 2.4 Validation `src/lib/validations/client-schemas.ts`
Schémas Zod miroir du backend (mêmes messages français).

### 2.5 Composants `src/components/clients/`
Réutiliser les composants existants + créer :
- `ClientAvatar.tsx` (initiales colorées).
- `ClientHealthBadge.tsx` (vert/orange/rouge selon solde vs limite).
- `ClientFilters.tsx` (recherche, type, ville, statut, export, toggle vue, clear).
- `ClientCard.tsx` (vue cartes).
- `ClientTable.tsx` (vue tableau, tri colonnes, pagination).
- `ClientForm.tsx` (création/édition + sous-form `ContactsRepeater.tsx`).
- `ClientDetailHeader.tsx` (header riche avec actions).
- `ClientStatsCards.tsx` (KPIs : CA, encours, factures, ancienneté).
- `ClientDocumentsTabs.tsx` (Devis / Ordres / Factures / Paiements / Avoirs).
- `ExportReleveModal.tsx` + `ReleveClientPdf.tsx` (jspdf).
- `DeleteClientDialog.tsx` (confirm + check garde).
- `EmptyClients.tsx` (état vide avec CTA).
- `ClientsSkeleton.tsx` (loading skeleton).
- `index.ts` barrel.

⚠️ Chaque composant **< 300 lignes**. Découper sinon.

### 2.6 Pages `src/pages/clients/`
- `ClientsListPage.tsx` (`/clients`) : header + filtres + table/cards + pagination + bouton « Nouveau client » + export.
- `NouveauClientPage.tsx` (`/clients/nouveau`) : `ClientForm` create.
- `ModifierClientPage.tsx` (`/clients/:id/modifier`) : `ClientForm` edit.
- `ClientDetailPage.tsx` (`/clients/:id`) : header + stats + tabs documents + historique.
- Gérer **loading / success / error / empty** sur chaque page.

### 2.7 Routes
Ajouter dans `src/App.tsx` (ou router central) sous `ProtectedRoute` + check permission `clients.voir`.

### 2.8 Sidebar / Navigation
Ajouter entrée « Clients » dans `src/components/Sidebar.tsx` avec icône `Users`, visible si `clients.voir`.

### 2.9 Permissions front
Utiliser `src/config/permissions` pour conditionner boutons (Créer, Modifier, Supprimer, Exporter).

### 2.10 i18n / messages
Tous les libellés et toasts **en français**. Toasts via `sonner` : succès, erreur, confirmation suppression.

### 2.11 Performance
- React Query `staleTime` 30 s, `gcTime` 5 min.
- `useDebounce(searchTerm, 300)`.
- Pagination serveur (jamais charger tout).
- Skeletons pendant chargement.
- Pas de re-render inutile (`useMemo`, `useCallback` ciblés).

### 2.12 Accessibilité
- `aria-label` sur boutons icônes.
- Focus visible.
- Contraste WCAG AA.
- Navigation clavier complète (formulaires, dialogs).

---

## 🔌 3. SYNCHRONISATION FRONT ↔ BACK

| Front (`Client`)         | Back (`ClientResource`)   |
|--------------------------|---------------------------|
| `solde: number`          | `round($client->solde)`   |
| `solde_avoirs: number`   | accessor `solde_avoirs`   |
| `ca_total: number`       | agrégat factures payées   |
| `nb_factures_impayees`   | `withCount` filtré        |
| `contacts: Contact[]`    | `ContactResource::collection` `whenLoaded` |

Vérifier que **chaque champ du type TS** est bien retourné par l'API.

---

## ✅ 4. CHECKLIST DE LIVRAISON (obligatoire)

- [ ] Migrations exécutables (`php artisan migrate`).
- [ ] Seeder permissions à jour.
- [ ] Policy enregistrée + middleware permission sur chaque route.
- [ ] Tous fichiers ≤ 300 lignes.
- [ ] Aucun `fetch`/`axios` direct dans un composant.
- [ ] Aucun `any` TS.
- [ ] Aucun `console.log` / `dd()` / `dump()`.
- [ ] Aucun secret ni URL hardcodée.
- [ ] Validation front (Zod) ↔ back (FormRequest) identiques.
- [ ] États loading / success / error / empty partout.
- [ ] Boutons désactivés pendant envoi.
- [ ] Pagination, tri, filtres serveur opérationnels.
- [ ] Export PDF / Excel / CSV fonctionnels.
- [ ] Suppression bloquée si dépendances actives.
- [ ] Tests PHPUnit verts.
- [ ] Build front sans warning TS.

---

## 📋 5. RAPPORT FINAL (à fournir après génération)

### Frontend
- Fichiers créés / modifiés / supprimés
- Composants découpés (si > 300 lignes)
- Hooks ajoutés

### Backend
- Migrations, Models, Requests, Resources, Controllers, Policies, Routes, Observers, Seeders créés/modifiés
- Endpoints exposés

### Refactorisation
- Code mort supprimé, imports nettoyés, optimisations

### Infrastructure
- Variables d'env nécessaires (aucune nouvelle si tout est déjà en place)
- Commandes à exécuter : `php artisan migrate`, `php artisan db:seed --class=RolesAndPermissionsSeeder`, `php artisan permission:cache-reset`

### Analyse
- Hypothèses faites
- Risques (perf sur clients > 10k, export PDF lourd, etc.)
- Points à surveiller en production

---

**👉 Génère maintenant le module Clients complet en respectant strictement ce cahier des charges et les Règles Maîtres en mémoire.**
