# 🎨 PROMPT COMPLET — FRONTEND LOGISTIGA V2 (Page par Page)

> **Usage** : Copier ce fichier dans Lovable pour générer le **frontend complet** de LogistiGA v2.
> Le backend Laravel existant (`https://facturation.logistiga.pro/api`) reste **inchangé** — on ne fait QUE consommer l'API.
> **Aucune page ne doit être oubliée.**

---

## 🧱 RÈGLES MAÎTRES (à appliquer à TOUTES les pages)

### Architecture
- **Stack** : React 18 + Vite 5 + TypeScript strict + Tailwind v3 + shadcn/ui + React Router v6 + TanStack Query v5 + react-hook-form + zod + axios + sonner + jspdf + xlsx
- **Structure feature-first** :
  ```
  src/
    app/              → routes, providers, layouts
    shared/           → ui (shadcn), hooks, utils, types globaux
    features/<nom>/   → pages, components, hooks, api, schemas, types
    services/api/     → clients axios par module (JAMAIS de fetch/axios dans les composants)
  ```
- **Limites strictes** :
  - Max **300 lignes par fichier** (composant, hook, service). Découper avant de livrer.
  - Aucun `any` TS. Aucune chaîne magique. Aucun secret hardcodé.
  - Aucun `console.log` ni `debugger` en livraison.

### API & données
- **Base URL** : `import.meta.env.VITE_API_URL` (jamais hardcodée).
- **Auth** : Sanctum cookies (CSRF) → axios `withCredentials: true`, `XSRF-TOKEN` géré automatiquement.
- **Tous les appels** passent par `src/services/api/<module>.ts`. Les composants utilisent UNIQUEMENT des hooks (`useXxxData`, `useXxxMutation`).
- **React Query** : `queryKey` typé, `staleTime` 30s minimum sur listes, invalidation ciblée après mutation.
- **Pagination serveur** : 20/page par défaut, max 100. Tri serveur.
- **Recherche** : debounce 300-600 ms (`useDebounce`).
- **Validation** : zod côté front IDENTIQUE aux FormRequests Laravel.
- **Montants XAF/FCFA** : toujours arrondis à l'entier (`roundMoney`).

### UI / UX (obligatoire sur CHAQUE page)
- États : **loading** (skeleton ou spinner), **success**, **error** (avec retry), **empty** (CTA), **isSearching**.
- Boutons d'action désactivés pendant `isPending` + spinner.
- Toasts via `sonner` (succès, erreur, info).
- Confirmation destructive via `AlertDialog`.
- Permissions vérifiées via `usePermission('module.action')` — masquer/désactiver les actions interdites.
- Responsive mobile-first. Layout : `MainLayout` desktop (sidebar) + `MobileLayout` (bottom nav).
- Design tokens uniquement (`bg-primary`, `text-foreground`, etc.) — JAMAIS de couleurs hardcodées.
- Accessibilité : `aria-label`, focus visible, navigation clavier, contraste AA.

### Sécurité front
- Aucune logique métier sensible côté front (le backend valide tout).
- Aucun rôle/permission stocké en localStorage — toujours re-vérifié via `/api/me`.
- CSP-friendly (pas d'`eval`, pas d'`innerHTML` non sanitisé).
- Liens externes : `rel="noopener noreferrer"`.

### Rapport obligatoire après chaque page livrée
Fichiers créés / modifiés / supprimés • Hooks ajoutés • Services API touchés • Routes ajoutées • Permissions requises • Risques / points à surveiller.

---

## 🗺️ INVENTAIRE COMPLET DES PAGES (78 pages — AUCUNE à oublier)

### 0. AUTH & ONBOARDING (5 pages)
1. `/login` — **Login.tsx** : email + mot de passe, "mot de passe oublié", lockout après 5 essais (`src/lib/lockout.ts`), redirection rôle-based.
2. `/pending-approval` — **PendingApproval.tsx** : compte créé en attente d'activation admin.
3. `/security/:action` — **SecurityAction.tsx** : action sécurisée par token (réinitialisation, validation device).
4. `/verifier-document/:token` — **VerifierDocument.tsx** + **VerificationDocument.tsx** : vérification publique d'un document via QR.
5. `/profil` — **Profil.tsx** : infos perso, changement mot de passe, sessions actives (`src/lib/sessions.ts`), connexions suspectes (`src/lib/suspicious-logins.ts`), préférences thème.

### 1. DASHBOARD & NAVIGATION (3 pages)
6. `/` — **Index.tsx** : redirection selon rôle.
7. `/dashboard` — **Dashboard.tsx** : KPIs 5 périodes (jour/semaine/mois/trimestre/année), graphiques (recharts), alertes échéances crédits, top clients, top conteneurs. Cache 5 min.
8. `/guide` — **Guide.tsx** : guide utilisateur intégré (lit `GUIDE_COMPLET_LOGISTIGA.md`).

### 2. CLIENTS (4 pages) → voir `PROMPT_PAGE_CLIENTS.md` pour détails
9. `/clients` — **Clients.tsx** : liste (table + cards), filtres (search, type, ville, statut), tri, pagination infinie, export Excel/CSV/PDF, stats globales.
10. `/clients/nouveau` — **NouveauClient.tsx** : formulaire création + multi-contacts.
11. `/clients/:id/modifier` — page modification (réutilise composant `ClientForm`).
12. `/clients/:id` — **ClientDetail.tsx** : header KPIs, tabs (Générales, Devis, Ordres, Factures, Paiements, Avoirs, Historique), export relevé PDF.

### 3. PARTENAIRES (4 pages)
13. `/partenaires` — **Partenaires.tsx** : armateurs, transitaires, représentants — onglets, filtres, CRUD.
14. `/partenaires/armateurs/:id` — **ArmateurDetail.tsx** : détail + conteneurs traités + factures.
15. `/partenaires/transitaires/:id` — **TransitaireDetail.tsx** : idem.
16. `/partenaires/representants/:id` — **RepresentantDetail.tsx** : idem + primes décaissées.

### 4. DEVIS (4 pages + dossier `devis/`)
17. `/devis` — **Devis.tsx** : liste, filtres (statut, client, période), tri, pagination, actions (créer, voir, modifier, dupliquer, convertir en ordre, annuler).
18. `/devis/nouveau` — **NouveauDevis.tsx** : formulaire complet (lignes, lots, conteneurs, taxes, totaux calculés backend).
19. `/devis/:id/modifier` — **ModifierDevis.tsx**.
20. `/devis/:id` — **DevisDetail.tsx** : header, lignes, totaux, actions (PDF, email, convertir, dupliquer, annuler).
21. `/devis/:id/pdf` — **DevisPDF.tsx** : preview PDF + download.

### 5. ORDRES DE TRAVAIL (4 pages + dossier `ordres-travail/`)
22. `/ordres-travail` — **OrdresTravail.tsx** : liste, filtres, conversion en facture.
23. `/ordres-travail/nouveau` — **NouvelOrdre.tsx**.
24. `/ordres-travail/:id/modifier` — **ModifierOrdre.tsx**.
25. `/ordres-travail/:id` — **OrdreDetail.tsx**.
26. `/ordres-travail/:id/pdf` — **OrdrePDF.tsx**.

### 6. FACTURES (5 pages + dossier `factures/`)
27. `/factures` — **Factures.tsx** : liste, filtres (statut payée/partielle/impayée, période), tri, pagination, multi-actions.
28. `/factures/exonerees` — **FacturesExonerees.tsx** : sous-liste factures TVA exonérée.
29. `/factures/nouvelle` — **NouvelleFacture.tsx**.
30. `/factures/:id/modifier` — **ModifierFacture.tsx**.
31. `/factures/:id` — **FactureDetail.tsx** : détail + paiements liés + avoirs + relances.
32. `/factures/:id/pdf` — **FacturePDF.tsx**.

### 7. NOTES DE DÉBUT / OPS (10 pages + dossier `notes-debut/`)
33. `/notes-debut` — **NotesDebut.tsx** : liste unifiée des 5 types de notes (Ouverture port, Détention, Relâche, Réparation, Personnalisée).
34. `/notes-debut/nouvelle` — **NouvelleNoteDebut.tsx** : sélecteur de type.
35. `/notes-debut/nouvelle/ouverture-port` — **NouvelleNoteOuverturePort.tsx**.
36. `/notes-debut/nouvelle/detention` — **NouvelleNoteDetention.tsx**.
37. `/notes-debut/nouvelle/relache` — **NouvelleNoteRelache.tsx**.
38. `/notes-debut/nouvelle/reparation` — **NouvelleNoteReparation.tsx**.
39. `/notes-debut/:id/modifier` — **ModifierNoteDebut.tsx**.
40. `/notes-debut/:id` — **NoteDebutDetail.tsx**.
41. `/notes-debut/:id/pdf` — **NoteDebutPDF.tsx**.
42. `/connaissement/:id/pdf` — **ConnaissementPDF.tsx**.

### 8. CONTENEURS & DÉTENTIONS (3 pages)
43. `/conteneurs-en-attente` — **ConteneursEnAttente.tsx** : liste sync OPS, actions (rattacher, ignorer).
44. `/detentions-en-attente` — **DetentionsEnAttente.tsx** : idem détentions.
45. `/operations-en-attente` — **OperationsEnAttente.tsx** : opérations OPS non rattachées.

### 9. CAISSE & BANQUE (5 pages + dossiers)
46. `/caisse` — **Caisse.tsx** : tableau mouvements + filtres période + solde temps réel.
47. `/caisse/globale` — **CaisseGlobale.tsx** : vue consolidée multi-caisses.
48. `/caisse/en-attente` — **CaisseEnAttente.tsx** : mouvements à valider.
49. `/banques` — **Banques.tsx** : liste comptes bancaires.
50. `/banques/:id` — **Banque.tsx** : mouvements + rapprochement.

### 10. PAIEMENTS & FINANCE (4 pages)
51. `/paiements-fournisseurs` — **PaiementsFournisseurs.tsx** : liste + création (modal unifié).
52. `/credits` — **Credits.tsx** : crédits bancaires, échéances, alertes.
53. `/credits/:id` — **CreditDetail.tsx** : détail + tableau d'amortissement.
54. `/primes-decaissement` — **PrimesDecaissement.tsx** : primes représentants + reçu PDF (`RecuPrimePDF.tsx` → 55).
55. `/primes/:id/recu/pdf` — **RecuPrimePDF.tsx**.

### 11. ANNULATIONS & AVOIRS (2 pages)
56. `/annulations` — **Annulations.tsx** : liste annulations factures + génération avoirs.
57. `/avoirs/:id/pdf` — **AvoirPDF.tsx**.

### 12. DÉPENSES (2 pages)
58. `/categories-depenses` — **CategoriesDepenses.tsx**.
59. `/categories-depenses/:id` — **CategorieDepenseDetail.tsx**.

### 13. PRÉVISIONS (1 page)
60. `/previsions` — **Previsions.tsx** : prévisions vs réalisé, alertes écart.

### 14. REPORTING (2 pages + dossier `reporting/`)
61. `/reporting` — **Reporting.tsx** : générateur reports (clients, factures, paiements, créances, caisse, crédits, primes, annulations, activité clients).
62. `/reporting/:type/pdf` — **ReportingPDF.tsx**.

### 15. EMAILS & NOTIFICATIONS (2 pages + dossier `emails/`)
63. `/emails` — **Emails.tsx** : templates + envois + historique.
64. `/notifications` — **Notifications.tsx** : centre notifications temps réel (Echo/Reverb).

### 16. ADMIN — UTILISATEURS, RÔLES, SÉCURITÉ (6 pages)
65. `/utilisateurs` — **Utilisateurs.tsx** : CRUD users, activation, reset mot de passe.
66. `/roles` — **Roles.tsx** : liste rôles + permissions.
67. `/roles/nouveau` & `/roles/:id/modifier` — **RoleForm.tsx**.
68. `/connexions-suspectes` — **ConnexionsSuspectes.tsx**.
69. `/tracabilite` — **Tracabilite.tsx** : audit log (qui a fait quoi).
70. `/numerotation` — **Numerotation.tsx** : config compteurs documents.

### 17. CONFIG & DIVERS (4 pages)
71. `/taxes` — **Taxes.tsx** : TVA, retenues, configuration taxes.
72. `/ai-assistant` — **AiAssistant.tsx** : chat IA (Lovable AI Gateway).
73. `/sync-queue` — **SyncQueue.tsx** : file de sync offline (IndexedDB).
74. `*` — **NotFound.tsx** : 404 avec retour dashboard.

---

## 📦 STRUCTURE FICHIERS À GÉNÉRER PAR PAGE

Pour CHAQUE feature listée ci-dessus, créer :

```
src/features/<feature>/
  pages/
    <Page>.tsx                  ← max 200 lignes, juste l'orchestration
  components/
    <Feature>Filters.tsx
    <Feature>Table.tsx
    <Feature>Card.tsx
    <Feature>Form.tsx
    <Feature>StatsCards.tsx
    <Feature>DetailHeader.tsx
    <Feature>EmptyState.tsx
    <Feature>Skeleton.tsx
    Delete<Feature>Dialog.tsx
  hooks/
    use<Feature>Data.ts         ← orchestration état + queries
    use<Feature>List.ts         ← liste paginée
    use<Feature>Detail.ts
    use<Feature>Mutations.ts    ← create/update/delete
    use<Feature>Stats.ts
  schemas/
    <feature>-schemas.ts        ← zod
  types/
    <feature>.ts                ← interfaces alignées backend
src/services/api/
  <feature>.ts                  ← axios calls UNIQUEMENT ici
```

---

## 🛣️ ROUTING CENTRAL (`src/app/routes.tsx`)

- Toutes les routes ci-dessus déclarées dans **un seul fichier**.
- Chaque route privée enveloppée dans `<ProtectedRoute permission="module.voir">`.
- Routes PDF (`/devis/:id/pdf`, `/factures/:id/pdf`, etc.) → layout minimal sans sidebar.
- Lazy-load par feature (`React.lazy` + `Suspense` + skeleton).

---

## 🎨 DESIGN SYSTEM (`src/index.css` + `tailwind.config.ts`)

- Palette LogistiGA (reprendre tokens existants) — HSL uniquement.
- Variants : `light`, `dark`.
- Composants shadcn customisés (Button, Card, Table, Dialog, Sheet, Tabs, Select, Combobox, DatePicker, DataTable).
- Animations légères (`animate-fade-in`, `animate-slide-up`).
- Aucune couleur dans les composants — uniquement classes sémantiques.

---

## ✅ CHECKLIST DE LIVRAISON (obligatoire avant chaque "page terminée")

- [ ] Fichier < 300 lignes
- [ ] Aucun `fetch`/`axios` dans le composant
- [ ] Aucun `any` TypeScript
- [ ] Aucun `console.log` / `debugger`
- [ ] États loading / error / empty / success présents
- [ ] Bouton submit désactivé pendant `isPending` + spinner
- [ ] Validation zod identique au FormRequest backend
- [ ] Permissions vérifiées (`usePermission`)
- [ ] Toasts sonner (succès + erreur)
- [ ] Confirmation destructive (AlertDialog)
- [ ] Responsive mobile testé
- [ ] Accessibilité (aria, focus, contraste)
- [ ] Tokens design (aucune couleur hardcodée)
- [ ] Build TypeScript sans warning
- [ ] Rapport fourni (fichiers créés/modifiés/supprimés, hooks, services, routes, permissions, risques)

---

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ (1 session = 1 bloc)

| Bloc | Pages | Sessions |
|------|-------|----------|
| **B1 — Fondations** | Setup + Auth (1-5) + Layout + Dashboard (6-8) | 1-2 |
| **B2 — Clients** | 9-12 | 1 |
| **B3 — Partenaires** | 13-16 | 1 |
| **B4 — Devis** | 17-21 | 1 |
| **B5 — Ordres** | 22-26 | 1 |
| **B6 — Factures** | 27-32 | 1 |
| **B7 — Notes / Connaissement** | 33-42 | 1-2 |
| **B8 — Conteneurs / Détentions** | 43-45 | 1 |
| **B9 — Caisse / Banque** | 46-50 | 1 |
| **B10 — Finance** | 51-55 | 1 |
| **B11 — Annulations / Avoirs / Dépenses** | 56-59 | 1 |
| **B12 — Prévisions / Reporting** | 60-62 | 1 |
| **B13 — Emails / Notifications** | 63-64 | 1 |
| **B14 — Admin** | 65-70 | 1 |
| **B15 — Config / Divers** | 71-74 | 1 |

**Total estimé : 15-17 sessions de chat pour le frontend complet.**

---

## 📋 COMMENT UTILISER CE PROMPT

À chaque nouvelle session Lovable, écrire :

> "Lis `PROMPT_FRONTEND_LOGISTIGA_V2.md` et livre **le Bloc B<N>** (pages X à Y) en suivant les règles maîtres. Respecte la checklist de livraison et fournis le rapport final."

Lovable génèrera la feature complète : pages + composants + hooks + services API + schémas zod + types + routes + permissions, en cohérence avec le backend Laravel de prod.

---

**Fin du prompt — 74 pages couvertes, aucune oubliée.**
