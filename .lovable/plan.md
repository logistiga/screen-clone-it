

## Lier le type de conteneur aux armateurs et l'afficher dans les conteneurs en attente

### Contexte

Le champ `type_conteneur` est deja recupere depuis la base OPS lors de la synchronisation, mais il n'est ni stocke ni affiche. L'utilisateur souhaite que ce champ soit visible dans la liste des conteneurs en attente, et qu'il soit lie a l'entite Armateur dans la page partenaires.

### Approche

Deux axes de travail :
1. **Stocker et afficher le type de conteneur** dans les conteneurs en attente (donnee venant d'OPS)
2. **Associer les types de conteneurs aux armateurs** dans la page partenaires pour reference

---

### Etape 1 : Stocker le type de conteneur depuis OPS

**Fichiers concernes :**
- `backend/database/migrations/` -- nouvelle migration pour ajouter la colonne `type_conteneur` a la table `conteneurs_traites`
- `backend/app/Models/ConteneurTraite.php` -- ajouter `type_conteneur` aux fillable
- `backend/app/Http/Controllers/Api/SyncDiagnosticController.php` -- stocker `sc.type_conteneur` lors de l'import
- `backend/app/Console/Commands/SyncFromOps.php` -- idem pour la commande Artisan

### Etape 2 : Afficher le type de conteneur dans la liste

**Fichiers concernes :**
- `src/lib/api/conteneurs-traites.ts` -- ajouter `type_conteneur` a l'interface `ConteneurTraite`
- `src/pages/ConteneursEnAttente.tsx` -- ajouter la colonne "Type" dans le tableau, entre "Conteneur" et "N BL"

### Etape 3 : Gerer les types de conteneurs par armateur

**Fichiers concernes :**
- `backend/database/migrations/` -- nouvelle migration pour creer une table `armateur_types_conteneurs` (ou ajouter un champ JSON `types_conteneurs` sur la table `armateurs`)
- `backend/app/Models/Armateur.php` -- ajouter la relation ou le cast JSON
- `backend/app/Http/Controllers/Api/ArmateurController.php` -- exposer les types dans l'API
- `src/types/partenaires.ts` -- ajouter `types_conteneurs` a l'interface `Armateur`
- `src/pages/ArmateurDetail.tsx` / page partenaires -- afficher les types de conteneurs associes a chaque armateur

### Etape 4 : Enrichir la sync pour alimenter les types par armateur

Lors de la synchronisation des conteneurs, si un nouveau couple (armateur, type_conteneur) est detecte, l'ajouter automatiquement a la liste des types de cet armateur. Cela permet de construire progressivement le referentiel des types par armateur.

---

### Details techniques

**Migration conteneurs_traites :**
```sql
ALTER TABLE conteneurs_traites ADD COLUMN type_conteneur VARCHAR(50) NULL AFTER numero_bl;
```

**Migration armateurs (option champ JSON) :**
```sql
ALTER TABLE armateurs ADD COLUMN types_conteneurs JSON NULL AFTER code;
```
Stockera un tableau comme `["20' DRY", "40' DRY", "40' HC", "20' REEFER"]`.

**Sync - mapping du champ :**
Dans `executeSyncConteneurs()`, ajouter :
```php
'type_conteneur' => $opsConteneur->type_conteneur,
```

**Frontend - colonne tableau :**
Ajout d'une colonne "Type" dans le `TableHeader` de la page ConteneursEnAttente, affichant le type du conteneur (ex: "20' DRY").

**Page Armateur Detail :**
Afficher une section "Types de conteneurs" listant les types associes a cet armateur sous forme de badges.

