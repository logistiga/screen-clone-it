## Refonte « Opérations Indépendantes » — Modal d'ajout de ligne typée (OT / Devis / Facture)

Aligner le module Facturation sur le système OPS visible sur les captures : un **modal "Ajouter une ligne"** avec sélecteur de type en haut, puis champs dynamiques selon le type. Le type est **par ligne** (déjà fait côté schéma), mais l'UI actuelle utilise un formulaire inline → on la remplace par un dialog modal identique aux captures.

### 1. Types de ligne — alignement OPS (4 types au lieu de 5)

Aligner sur OPS qui n'a que **4 types** : `TRANSPORT`, `LOCATION`, `MANUTENTION`, `AUTRE`.

- Supprimer `double_relevage` et `stockage` du sélecteur de ligne (ils restent valides en BDD pour rétrocompat lecture, mais ne sont plus proposés à la création).
- Ajouter `autre` comme nouveau type côté front + backend (service `AutreService`, validation, factory).

### 2. Champs dynamiques par type (selon captures)

| Type | Champs spécifiques |
|---|---|
| **Transport** | Point de départ (défaut « Libreville », readonly hint), Point d'arrivée (select destinations), Type de transport (Conteneur / Marchandise / Engin / Matériel), Mode de trajet (Aller simple / Aller-retour), Quantité, Prix transport, Description (optionnel) |
| **Location** | Matériel à louer (select), Date début, Date fin, Nombre de jours (auto-calculé, éditable), Prix/jour, Description (optionnel). Total = jours × prix/jour affiché en bas du modal |
| **Manutention** | Matériel utilisé (select), Description, Quantité, Prix unitaire. Total affiché |
| **Autre** | Description (requis), Quantité, Prix unitaire. Total affiché |

### 3. Composant `LigneModal` (nouveau)

Créer `src/components/operations/LigneModal.tsx` :
- Dialog shadcn avec header « Ajouter une ligne » / « Modifier la ligne »
- Select type en haut + helper "Une opération peut combiner plusieurs types de lignes."
- Sous-formulaires par type : `TransportFields`, `LocationFields`, `ManutentionFields`, `AutreFields`
- Footer : Annuler / Ajouter (ou Enregistrer)
- Validation locale avant submit, calcul `montantHT` injecté dans la ligne renvoyée

### 4. Refonte `OperationsIndependantesForm.tsx`

Remplacer le rendu actuel (cartes inline avec 5 boutons par ligne) par :
- Liste compacte des lignes ajoutées (tableau : Type / Description / Qté / PU / Total / actions)
- Bouton **« + Ajouter une ligne »** qui ouvre `LigneModal` en mode création
- Clic sur une ligne → ouvre `LigneModal` en mode édition
- Bouton supprimer par ligne
- Bandeau total HT en bas

### 5. Données de référence (selects)

- **Destinations transport** : liste configurable (ex: Port-Gentil, Franceville, Oyem, Mouila, Lambaréné, Tchibanga…). Stockée dans `src/data/transportData.ts`.
- **Types de transport** : `conteneur | marchandise | engin | materiel`
- **Mode de trajet** : `aller_simple | aller_retour`
- **Matériels** (location & manutention) : récupérés depuis `descriptionsApi` filtré par catégorie, fallback liste statique (`Grue`, `Chariot élévateur`, `Camion plateau`, `Reach stacker`, etc.) dans `src/data/materielsData.ts`.

### 6. Persistance des champs spécifiques

Étendre `LignePrestationEtendue` (déjà partiellement fait) avec :
```ts
typeOperation: 'transport'|'location'|'manutention'|'autre'|''
// transport
pointDepart?: string
pointArrivee?: string
typeTransport?: 'conteneur'|'marchandise'|'engin'|'materiel'
modeTrajet?: 'aller_simple'|'aller_retour'
// location
materiel?: string
dateDebut?: string
dateFin?: string
nombreJours?: number
// manutention
materielManutention?: string
```

**Backend** : ajouter migration `2026_06_18_000001_add_ligne_operation_fields.php` qui ajoute sur `lignes_ordres`, `lignes_devis`, `lignes_factures` :
- `point_depart` (string, null)
- `point_arrivee` (string, null)
- `type_transport` (string, null)
- `mode_trajet` (string, null)
- `materiel` (string, null)
- `nombre_jours` (integer, null)
- `date_debut`, `date_fin` déjà existants ou à ajouter si absents

Mise à jour `LigneOrdre`/`LigneDevis`/`LigneFacture` ($fillable + casts), Resources, FormRequests, services de normalisation (`TransportService`, `LocationService`, `ManutentionService`, nouveau `AutreService`).

### 7. Mapping front ↔ backend

`useOrdreForm.ts` / `useDevisForm.ts` / `useFactureForm.ts` : étendre le payload de mapping des lignes avec les nouveaux champs (snake_case). Hydratation inverse dans `ModifierOrdre` / `ModifierDevis` / `ModifierFacture`.

### 8. Nettoyage

- Supprimer les anciens fichiers `DoubleRelevageFormFields.tsx`, `StockageFormFields.tsx` (non utilisés dans le nouveau flow) ou les laisser inertes.
- Garder la rétrocompat lecture : si une ligne existante a `type_operation = 'double_relevage' | 'stockage'`, l'afficher en lecture comme `Autre` dans la liste.

### 9. Non-objectifs (hors scope de ce lot)

- PDF templates (mise à jour visuelle des nouveaux champs) — sera fait ensuite
- Synchronisation OPS (lecture cross-DB) — déjà géré par la vue SQL
- Migration de données historiques (le backfill précédent suffit)

### Fichiers touchés (estimation)

**Nouveaux** :
- `src/components/operations/LigneModal.tsx`
- `src/components/operations/forms/TransportFields.tsx` (refait)
- `src/components/operations/forms/LocationFields.tsx` (refait)
- `src/components/operations/forms/ManutentionFields.tsx` (refait)
- `src/components/operations/forms/AutreFields.tsx`
- `src/data/transportData.ts`, `src/data/materielsData.ts`
- `backend/database/migrations/2026_06_18_000001_add_ligne_operation_fields.php`
- `backend/app/Services/OperationsIndependantes/AutreService.php`

**Modifiés** :
- `src/components/operations/OperationsIndependantesForm.tsx` (refonte)
- `src/types/documents.ts`
- `src/components/ordres/shared/useOrdreForm.ts`, `useDevisForm.ts`, `useFactureForm.ts`
- `src/pages/ModifierOrdre.tsx`, `ModifierDevis.tsx`, `ModifierFacture.tsx`
- `src/lib/validations/ordre-schemas.ts` (+ devis/facture si existants)
- Backend : modèles lignes, Resources, FormRequests, `OperationIndependanteFactory`, services Transport/Location/Manutention
