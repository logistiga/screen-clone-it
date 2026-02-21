

## Corriger la synchronisation pour recuperer le type de conteneur des armateurs

### Probleme

La table `armateurs` dans la base OPS contient une colonne `type_conteneur` (ex: "20 pieds", "40 pieds"), mais les deux endroits qui synchronisent les armateurs ne lisent pas ce champ :
- `SyncDiagnosticController.php` : select `id, nom, code` seulement
- `SyncFromOps.php` : select `id, nom, code, actif, created_at, updated_at` seulement

Le champ `type_conteneur` de la source OPS n'est jamais recupere ni stocke dans le champ local `types_conteneurs` (JSON).

### Corrections

**Fichier 1 : `backend/app/Http/Controllers/Api/SyncDiagnosticController.php`**
- Ajouter `type_conteneur` dans le `select` de la requete armateurs (ligne 334)
- Lors du `create` et `update`, convertir la valeur `type_conteneur` en tableau JSON et la stocker dans `types_conteneurs`

**Fichier 2 : `backend/app/Console/Commands/SyncFromOps.php`**
- Ajouter `type_conteneur` dans le `select` de la requete armateurs (ligne 160)
- Lors du `create` et `update`, stocker `type_conteneur` dans `types_conteneurs` sous forme de tableau

### Logique de mapping

La base OPS stocke un seul `type_conteneur` (string), tandis que le local utilise `types_conteneurs` (JSON array). Le mapping sera :
- OPS : `type_conteneur = "20 pieds"` devient local : `types_conteneurs = ["20 pieds"]`
- Si la valeur est null ou vide, on laisse le champ tel quel

### Details techniques

SyncDiagnosticController (ligne ~332-364) :
```php
// Avant
->select(['id', 'nom', 'code'])

// Apres
->select(['id', 'nom', 'code', 'type_conteneur'])

// Dans create/update, ajouter :
'types_conteneurs' => !empty($opsArm->type_conteneur) ? [$opsArm->type_conteneur] : [],
```

SyncFromOps (ligne ~158-190) :
```php
// Avant
->select(['id', 'nom', 'code', 'actif', 'created_at', 'updated_at'])

// Apres
->select(['id', 'nom', 'code', 'type_conteneur', 'actif', 'created_at', 'updated_at'])

// Dans create/update, ajouter :
'types_conteneurs' => !empty($opsArmateur->type_conteneur) ? [$opsArmateur->type_conteneur] : [],
```

Aucune modification frontend necessaire -- les badges sont deja affiches dans la page Partenaires.

