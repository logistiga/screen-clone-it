## Objectif

Réorganiser le module **Opérations Indépendantes** (Ordres de Travail, Devis, Factures) :

- En-tête simplifié : **client, date, type de marchandise (nouveau), description générale (nouveau), observation interne (nouveau)**.
- **Plus de type d'opération unique** en en-tête — le type est désormais **choisi par ligne** parmi : Transport, Location, Manutention, Double Relevage, Stockage.

## Nouveau flux (formulaire)

```text
┌─ En-tête ────────────────────────────────────────┐
│ Client *           Date opération *              │
│ Type marchandise * [Conteneur│Matériel│MG│Engin│Autre]
│ Description générale (textarea)                  │
│ Observation interne (textarea, non imprimée PDF) │
└──────────────────────────────────────────────────┘

┌─ Lignes ────────────────────────── [+ Ajouter] ──┐
│ Ligne 1                                          │
│   Type d'opération * [Transport│Location│…]      │
│   ↳ champs spécifiques au type sélectionné       │
│   Description, Quantité, Prix, Montant HT        │
│ Ligne 2  …                                       │
└──────────────────────────────────────────────────┘
```

## Backend (Laravel)

### Migration
Nouveau fichier `add_marchandise_fields_to_documents.php` :
- `ordres_travail`, `devis`, `factures` : ajouter
  - `type_marchandise` ENUM('conteneur','materiel','marchandise_generale','engin','autre') NULL
  - `description_generale` TEXT NULL
  - `observation_interne` TEXT NULL
- `lignes_ordres`, `lignes_devis`, `lignes_factures` : la colonne `type_operation` existe déjà → s'assurer qu'elle est NOT NULL via défaut applicatif (pas de changement de schéma destructif).
- Migration de données : pour les OT/Devis/Facture existants en `categorie = operations_independantes`, copier `type_operation_indep` du parent dans chaque ligne enfant si `lignes.type_operation` est NULL.

### Models / Resources
- Ajouter les 3 champs dans `$fillable` de `OrdreTravail`, `Devis`, `Facture`.
- Exposer dans `OrdreTravailResource`, `DevisResource`, `FactureResource`.
- `LigneOrdreResource`, `LigneDevisResource`, `LigneFactureResource` : déjà retournent `type_operation` → OK.

### FormRequests
`StoreOrdreTravailRequest`, `UpdateOrdreTravailRequest`, et équivalents Devis/Facture :
- ajouter validation :
  - `type_marchandise` : `nullable|in:conteneur,materiel,marchandise_generale,engin,autre`
  - `description_generale`, `observation_interne` : `nullable|string|max:2000`
- `type_operation_indep` (en-tête) : devient **optionnel et deprecated** (conservé pour rétrocompatibilité, n'est plus exigé).
- `lignes.*.type_operation` : reste `required_with:lignes`.

### Services
Dans `OrdreServiceFactory` / équivalents Devis & Facture : persister les 3 nouveaux champs lors de create/update. Aucun changement de calcul (totaux inchangés).

## Frontend (React/TS)

### Types (`src/types/documents.ts`)
- Ajouter `TypeMarchandise = 'conteneur' | 'materiel' | 'marchandise_generale' | 'engin' | 'autre'` + helper labels.
- Étendre `LignePrestationEtendue` avec `typeOperation: TypeOperationIndep` (par ligne).

### Composant principal : `OperationsIndependantesForm.tsx`
- Supprimer la prop `typeOperationIndep` globale.
- Pour chaque ligne, ajouter en haut un **sélecteur de type d'opération** (5 boutons compacts) qui détermine quel `*FormFields` rendre.
- Remplacer `getInitialPrestationEtendue()` → renvoyer `typeOperation: ''` par défaut.

### Composants parents (3 formulaires)
- `OrdreIndependantForm.tsx`, `DevisIndependantForm.tsx`, `FactureIndependantForm.tsx` :
  - **Retirer** la grosse Card « Sélection du type d'opération » globale.
  - **Ajouter** une Card « Informations marchandise » avec : Type marchandise (Select 5 options), Description générale (Textarea), Observation interne (Textarea).
  - Étendre `*Data` interface : `typeMarchandise`, `descriptionGenerale`, `observationInterne`.
  - Supprimer (ou rendre optionnel deprecated) le state `typeOperationIndep`.

### useOrdreForm + équivalents Devis/Facture
- Mapper les nouveaux champs vers/depuis l'API.
- Inclure `lignes[].type_operation` dans le payload (déjà supporté côté API).

### Validations zod (`ordre-schemas.ts`, devis-schemas, facture-schemas)
- Schémas indépendant : retirer l'obligation de `typeOperationIndep` à la racine, ajouter `typeMarchandise` requis, exiger `prestations[].typeOperation`.

### Affichage (helpers/table/badge)
- `ordres-helpers.tsx` : `getTypeBadge` pour catégorie `operations_independantes` → si plusieurs lignes de types différents → badge "Indépendant (multi)", sinon afficher le type de la première ligne. Bonus : afficher `type_marchandise` comme sous-libellé.

### PDF (Blade templates `pdf/devis.blade.php`, `pdf/facture.blade.php`, `pdf/ordre-travail.blade.php` si présent)
- En tête : afficher Type marchandise + Description générale.
- Ne **pas** imprimer Observation interne.
- Colonne « Type opération » ajoutée dans le tableau des lignes pour les Indépendantes.

## Rétrocompatibilité

- `type_operation_indep` (en-tête) conservé en base et lu en fallback : si nouveau document n'a pas ce champ mais a des lignes, OK ; les anciens documents continuent d'afficher correctement.
- Migration backfills `lignes.type_operation` depuis `type_operation_indep` parent pour éviter des lignes orphelines.

## Hors périmètre

- Pas de changement aux Conteneurs ni Conventionnel.
- Pas de changement aux calculs de taxes/totaux.
- Vue OPS `v_ops_independantes` : sera mise à jour dans un second temps pour exposer les nouveaux champs (à confirmer après validation de ce plan).

## Livrables (fichiers touchés)

Backend (~10) : 1 migration + 3 models + 3 resources + 6 FormRequests + 3 services.
Frontend (~10) : `types/documents.ts`, `OperationsIndependantesForm.tsx`, 3 forms parents, 3 validations, `ordres-helpers.tsx`, `useOrdreForm` (+ Devis/Facture).
PDF (3 blade).