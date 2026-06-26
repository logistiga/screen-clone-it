## Lot L1.3 — Unification des pages Nouveau* / Modifier* Devis · Ordre · Facture

### État actuel (6 pages, 3 316 lignes)

```text
NouveauDevis.tsx        229
ModifierDevis.tsx       255
NouvelOrdre.tsx         557
ModifierOrdre.tsx       558
NouvelleFacture.tsx     823
ModifierFacture.tsx     894
```

Patterns dupliqués page-à-page (≈ 75 % de code commun entre `Nouveau*` et `Modifier*` de chaque document, et ≈ 40 % entre les 3 documents) :

- chargement parallèle `clients / armateurs / transitaires / représentants` + `toArray`
- hook formulaire (`useDevisForm` / `useOrdreForm` / `useFactureForm`)
- init taxes recommandées
- auto-save brouillon (création) / hydratation depuis API (édition)
- pré-remplissage `prefill` via `sessionStorage` (Ordre & Facture)
- header back + titre + badge statut (édition) + `AutoSaveIndicator` (création)
- rendu `<XxxForm mode="create"|"edit">` ou stepper inline (Ordre / Facture)
- submit → mutation → navigate + gestion erreurs Laravel `errors{}`

### Architecture cible

Un seul shell par document, qui couvre les deux modes via une prop `mode`. Les pages racine deviennent des shims de ~30 lignes.

```text
src/components/documents/pages/
├── index.ts
├── useDocumentPageData.ts        # fetch clients/armateurs/transitaires/representants + toArray + isLoading/error agrégés
├── useDocumentPrefill.ts         # lecture sessionStorage "prefill_ordre" / "prefill_facture" (no-op pour devis)
├── useDocumentHydration.ts       # hydratation API → api.setX (mode edit) + extraction initialChildData
├── useDocumentAutoSave.ts        # wrap useAutoSave + save/restore typés par document (mode create)
├── useDocumentSubmit.ts          # create vs update + toast erreurs Laravel + clear draft + navigate
├── DocumentPageHeader.tsx        # back + titre + icône + badge statut (edit) + AutoSaveIndicator (create)
├── DevisPageShell.tsx            # assemble les hooks + <DevisForm mode>
├── OrdrePageShell.tsx            # idem + stepper Ordre + ConfirmationSaveModal
└── FacturePageShell.tsx          # idem + spécificités facture
```

Les pages racine (`src/pages/NouveauDevis.tsx`, etc.) deviennent :

```tsx
export default function NouveauDevisPage() {
  return <DevisPageShell mode="create" />;
}
```

### Compatibilité

- Routes inchangées (`/devis/nouveau`, `/devis/:id/modifier`, etc.).
- `useDevisForm` / `useOrdreForm` / `useFactureForm` réutilisés tels quels — pas de modification des hooks de formulaire ni des composants `*Form` shims (livrés en L1.1 / L1.2).
- Aucune modification backend.
- `AutoSaveIndicator`, `ConfirmationSaveModal`, `OrdreStepper`, validations Zod : réutilisés à l'identique.

### Découpage en sous-lots

Livraison **un document à la fois**, `tsgo --noEmit` après chaque :

- **L1.3.a** Hooks + header partagés (`useDocumentPageData`, `useDocumentHydration`, `useDocumentAutoSave`, `useDocumentSubmit`, `DocumentPageHeader`). Aucun changement visible.
- **L1.3.b** `DevisPageShell` + shims `NouveauDevis` / `ModifierDevis`. Gain ≈ 380 lignes (sur 484).
- **L1.3.c** `OrdrePageShell` + shims `NouvelOrdre` / `ModifierOrdre`. Gain ≈ 950 lignes (sur 1 115). Inclut prefill conteneur + stepper + ConfirmationSaveModal.
- **L1.3.d** `FacturePageShell` + shims `NouvelleFacture` / `ModifierFacture`. Gain ≈ 1 480 lignes (sur 1 717). Le plus complexe (prefill ordre→facture, gestion remise/taxes hydratées).

Gain total estimé : **~ 2 800 lignes supprimées** (3 316 → ~ 510).

### Risques

- **Modes mixtes** : `Modifier*` n'a pas d'auto-save mais a hydratation API ; `Nouveau*` l'inverse. Le shell doit gérer les deux sans réintroduire les bugs (double init taxes, double hydratation, prefill qui écrase l'API).
- **Facture conteneurs** : la pré-remplissage depuis ordre touche `conteneursData` complet (lots, prix, opérations) — à porter intégralement, sans simplifier.
- **Ordre conteneurs (prefill `?prefill=conteneur`)** : 65 lignes spécifiques à conserver telles quelles dans `useDocumentPrefill`.
- **Tests manuels obligatoires après chaque sous-lot** : créer + modifier 1 document de chaque catégorie (conteneurs / conventionnel / indépendant).

### Validation

- `tsgo --noEmit` après chaque sous-lot.
- Build Vite final.
- Smoke test : créer un devis indépendant → convertir en ordre (prefill) → convertir l'ordre en facture (prefill) → modifier la facture.

### Question

1. Je démarre directement par **L1.3.a + L1.3.b (Devis)** en une seule livraison (le plus petit, sert de référence pour valider l'archi) ?
2. Ou je commence par L1.3.a seul (hooks + header) puis pause pour validation avant les shells ?
