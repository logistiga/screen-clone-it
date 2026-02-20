

# Connexion de la synchronisation à la base `logiwkuh_tc`

## Probleme identifie

Le code actuel de synchronisation est ecrit pour le schema de `logiwkuh_ops`, mais la base cible est `logiwkuh_tc` qui a un schema completement different :

| Aspect | Code actuel (ops) | Base reelle (tc) |
|---|---|---|
| Table | `sorties_conteneurs` | `sortie_conteneurs` |
| Client | `nom_client` (texte) | `client_id` (FK) |
| Armateur | `code_armateur` (texte) | `armateur_id` (FK) |
| Transitaire | `nom_transitaire` (texte) | `transitaire_id` (FK) |
| Statut | colonne `statut` | absente |
| Dates | `date_sortie`, `date_retour` | absentes |
| Specifique | -- | `type_detention`, `jours_gratuits`, `type_transport` |

## Plan de correction

### 1. Configuration de la connexion (`.env` serveur)

Mettre a jour la variable `OPS_DB_DATABASE` sur le serveur de production :

```
OPS_DB_DATABASE=logiwkuh_tc
```

Puis executer `php artisan config:clear` sur le serveur.

### 2. Adapter `SyncDiagnosticController::executeSyncConteneurs()`

Reecrire la methode pour :

- Utiliser la table `sortie_conteneurs` (singulier)
- Faire des **jointures** avec les tables `clients`, `armateurs`, `transitaires` de `logiwkuh_tc` pour recuperer les noms a partir des IDs
- Supprimer les filtres sur `statut` et `deleted_at` (colonnes inexistantes)
- Mapper les nouvelles colonnes (`type_detention`, `jours_gratuits`, `type_transport`)

La requete deviendra quelque chose comme :

```php
DB::connection('ops')
    ->table('sortie_conteneurs as sc')
    ->leftJoin('clients as c', 'sc.client_id', '=', 'c.id')
    ->leftJoin('armateurs as a', 'sc.armateur_id', '=', 'a.id')
    ->leftJoin('transitaires as t', 'sc.transitaire_id', '=', 't.id')
    ->select([
        'sc.id as sortie_id_externe',
        'sc.numero_conteneur',
        'sc.numero_bl',
        'sc.type_conteneur',
        'c.nom as nom_client',
        'a.code as code_armateur',
        'a.nom as armateur_nom',
        't.nom as nom_transitaire',
        'sc.camion_id',
        'sc.remorque_id',
        'sc.type_transport',
        'sc.type_detention',
        'sc.jours_gratuits',
    ])
    ->get();
```

### 3. Adapter le mapping d'insertion

Mettre a jour le bloc `ConteneurTraite::create()` pour :
- Utiliser les colonnes disponibles dans TC
- Mettre `null` pour les champs absents (`date_sortie`, `date_retour`, `prime_chauffeur`)
- Stocker `type_detention` dans `destination_type` (ou un champ adapte)
- Ne plus filtrer par `statut` OPS (importer tous les conteneurs)

### 4. Adapter la synchronisation des armateurs

La methode `syncArmateurs` utilise la commande Artisan `sync:from-ops`. Il faudra verifier que cette commande utilise aussi le bon nom de table `armateurs` (visible dans le sidebar de votre screenshot, donc OK).

## Section technique

**Fichiers a modifier :**
- `backend/app/Http/Controllers/Api/SyncDiagnosticController.php` : methode `executeSyncConteneurs()` - reecrire la requete et le mapping
- Aucun changement cote frontend necessaire (les colonnes affichees restent les memes)

**Risque :** aucun risque de perte de donnees, on modifie uniquement la lecture depuis la base externe.

**Action manuelle requise sur le serveur :**
1. Modifier `.env` : `OPS_DB_DATABASE=logiwkuh_tc`
2. Executer : `php artisan config:clear`
