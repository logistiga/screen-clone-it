# Lot L4 — Centralisation des appels API

## Objectif
Supprimer tous les imports directs de l'instance axios brute (`@/lib/api`) depuis les **composants, pages et hooks**. Toute la communication réseau passera par des modules dans `src/services/api/` (qui réutilisent l'instance axios partagée).

## Fichiers à migrer (25)

**Hooks (4)**
- `src/hooks/use-network-status.tsx`
- `src/hooks/use-auto-sync.tsx`
- `src/hooks/use-auth.tsx`
- `src/hooks/use-detentions-attente.ts`

**Pages (10)**
- `src/pages/Dashboard.tsx`
- `src/pages/CaisseEnAttente.tsx`
- `src/pages/Reporting.tsx`
- `src/pages/Roles.tsx`
- `src/pages/NoteDebutPDF.tsx`
- `src/pages/SecurityAction.tsx`
- `src/pages/PendingApproval.tsx`
- `src/pages/PrimesDecaissement.tsx`
- `src/pages/caisse/useCaisseData.ts`
- `src/pages/notes-debut/NotesTable.tsx`
- `src/pages/paiements-fournisseurs/usePaiementsFournisseursData.ts`
- `src/pages/paiements-fournisseurs/PFModals.tsx`

**Composants (7)**
- `src/components/RemboursementAnnulationModal.tsx`
- `src/components/debug/DebugPanel.tsx`
- `src/components/caisse/ExportCaisseModal.tsx`
- `src/components/caisse/ExportCaisseGlobaleModal.tsx`
- `src/components/caisse/caisse-attente/RefusModal.tsx`
- `src/components/caisse/caisse-attente/PrimesTable.tsx`
- `src/components/caisse/caisse-attente/GarageTable.tsx`
- `src/components/caisse/caisse-attente/DecaissementModal.tsx`

**Utilitaires (1)**
- `src/lib/export/releve-client.ts`

> Hors scope : `src/lib/api/**` (définitions), `src/services/**` (déjà couche service), `src/lib/offline/**`, `src/lib/sessions.ts`, `src/lib/suspicious-logins.ts` (infra légitime).

## Structure cible

Création de `src/services/api/` avec un module par domaine, qui ré-exporte/wrappe les appels existants :

```text
src/services/api/
├── index.ts                  # barrel
├── auth.api.ts               # /login, /logout, /me, /csrf
├── dashboard.api.ts          # /dashboard/*
├── caisse.api.ts             # /caisse, /caisse-en-attente, primes, garage
├── paiements-fournisseurs.api.ts
├── notes-debut.api.ts        # wrapper sur lib/api/notes-debut
├── reporting.api.ts
├── roles.api.ts
├── security.api.ts           # security-action, pending-approval
├── annulations.api.ts        # remboursements
├── network.api.ts            # ping/health
├── sync.api.ts               # auto-sync endpoints
├── debug.api.ts
└── export.api.ts             # releve-client, export caisse
```

Chaque module : fonctions typées (pas de `any`), retour `Promise<T>`, gestion erreur déléguée à React Query / appelant.

## Procédure par fichier
1. Lire le fichier.
2. Extraire chaque `api.get/post/...` dans une fonction nommée dans le module `services/api/<domaine>.api.ts`.
3. Remplacer l'import `@/lib/api` par l'import nommé depuis `@/services/api`.
4. Garder strictement la même signature côté UI (pas de changement de comportement).

## Validation
- `tsgo` après chaque lot (groupes de 5 fichiers).
- Build Vite final.
- Smoke test : Dashboard, Caisse en attente, Reporting, Login.

## Découpage en sous-lots (pour limiter le risque)
- **L4.1** Hooks (4 fichiers) + `auth.api.ts`, `network.api.ts`, `sync.api.ts`, `caisse.api.ts` (détentions)
- **L4.2** Caisse (8 fichiers composants + `useCaisseData`) + `caisse.api.ts`, `export.api.ts`
- **L4.3** Paiements fournisseurs (2 fichiers) + `paiements-fournisseurs.api.ts`
- **L4.4** Notes début + Reporting + Roles + PrimesDecaissement + NoteDebutPDF (5 fichiers)
- **L4.5** Dashboard + SecurityAction + PendingApproval + DebugPanel + RemboursementAnnulationModal + releve-client (6 fichiers)

## Livrable
Après chaque sous-lot, rapport conforme aux règles maîtres : fichiers créés / modifiés / risques.

## Question
Tu confirmes ce découpage en 5 sous-lots livrés un par un (recommandé) — ou tu veux que je livre tout L4 d'un coup ?
