## Objectif L1
Mutualiser les 9 formulaires Devis/Ordre/Facture (Conteneurs / Conventionnel / Indépendant) + les 3 formulaires `Lignes*` en un seul ensemble paramétré par `documentType: 'devis' | 'ordre' | 'facture'`. Cible : ~ -2 500 à -3 000 lignes.

État actuel : **3 581 lignes** sur 12 fichiers.

```text
devis/forms/         474 + 260 + 175 + 114 = 1023
ordres/forms/        718 + 310 + 241 + 103 = 1372
factures/forms/      604 + 284 + 157 + 113 = 1158
```

## Architecture cible

Nouveau dossier `src/components/documents/forms/` :

```text
src/components/documents/forms/
├── index.ts
├── types.ts                    # DocumentType, DocumentFormConfig, Ligne unifiée
├── config.ts                   # labels/champs par documentType (titres, libellés, clés)
├── LignesForm.tsx              # remplace LignesDevisForm + LignesOrdreForm + LignesFactureForm
├── DocumentConteneursForm.tsx  # remplace les 3 *ConteneursForm
├── DocumentConventionnelForm.tsx
└── DocumentIndependantForm.tsx
```

Chaque formulaire reçoit `documentType` + données + handlers ; le rendu différencié (titre "Lignes du devis" / "Lignes de l'ordre" / "Lignes de facture", clé `montant` vs `montantHT`, libellé `Désignation` vs `Description`, présence de `unite`, etc.) est piloté par `config.ts`.

## Compatibilité

Pour ne pas casser les 5 pages consommatrices (`NouveauDevis`, `NouvelOrdre`, `NouvelleFacture`, `ModifierOrdre`, `ModifierFacture`) ni les hooks `useDevisForm` / `useOrdreForm`, les anciens chemins (`@/components/devis/forms`, `ordres/forms`, `factures/forms`) seront conservés en **shims** :

```ts
// src/components/devis/forms/index.ts
export { DocumentConteneursForm as DevisConteneursForm } from "@/components/documents/forms";
// + ré-exports des types existants
```

→ aucune modification des imports existants nécessaire. Les pages continuent de fonctionner. Les types `LigneDevis` / `LigneOrdre` / `LigneFacture` restent exportés sous leurs anciens noms (alias d'un type unifié `DocumentLigne`).

## Découpage en sous-lots

- **L1.1** Mutualiser `LignesForm` (3 → 1 fichier). Gain ~ 220 lignes. Risque faible.
- **L1.2** Mutualiser `IndependantForm` (3 → 1). Gain ~ 350 lignes.
- **L1.3** Mutualiser `ConventionnelForm` (3 → 1). Gain ~ 580 lignes.
- **L1.4** Mutualiser `ConteneursForm` (3 → 1). Gain ~ 1 250 lignes. Le plus complexe (Ordre = 718 lignes vs Devis = 474), nécessite normalisation des champs spécifiques (numéro BL, dates de livraison, etc.).

Livraison **un sous-lot à la fois**, avec `tsgo` après chaque, et rapport conforme aux règles maîtres (fichiers créés / modifiés / supprimés / risques).

## Validation

- `tsgo --noEmit` après chaque sous-lot.
- Build Vite final.
- Smoke test manuel : créer un devis, un ordre, une facture (chaque catégorie) + modifier un ordre et une facture existants.

## Question
Tu confirmes :
1. Le découpage en 4 sous-lots livrés un par un (recommandé) ?
2. La stratégie shim (anciens chemins préservés) — ou tu préfères qu'on migre les 5 pages en même temps vers `@/components/documents/forms` ?