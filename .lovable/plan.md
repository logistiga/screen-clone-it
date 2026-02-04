
# Plan : Correction des permissions d'annulation (Erreur 500)

## Résumé du problème

L'annulation d'un ordre de travail échoue avec une erreur 500 car le middleware vérifie une permission `annulations.creer` qui **n'existe pas** dans la base de données. Le fichier `config/permissions.php` ne définit pas de module "annulations".

## Solution retenue

Utiliser les permissions existantes des documents (`ordres.annuler`, `factures.annuler`, `devis.annuler`) au lieu de créer une nouvelle famille de permissions. Cela est cohérent avec l'architecture actuelle.

---

## Modifications à effectuer

### 1. Mettre à jour les routes API (backend/routes/api.php)

Remplacer les middlewares `permission:annulations.*` par les permissions des documents correspondants :

| Route actuelle | Permission actuelle | Nouvelle permission |
|----------------|---------------------|---------------------|
| `POST annulations/ordre/{ordre}` | `annulations.creer` | `ordres.annuler` |
| `POST annulations/facture/{facture}` | `annulations.creer` | `factures.annuler` |
| `POST annulations/devis/{devis}` | `annulations.creer` | `devis.annuler` |
| `GET annulations/` | `annulations.voir` | `ordres.voir` |
| `GET annulations/stats` | `annulations.voir` | `ordres.voir` |
| `GET annulations/{annulation}` | `annulations.voir` | `ordres.voir` |
| `PUT annulations/{annulation}` | `annulations.modifier` | `ordres.modifier` |
| `POST {annulation}/valider` | `annulations.valider` | `ordres.valider` |
| `POST {annulation}/rejeter` | `annulations.valider` | `ordres.valider` |
| `POST {annulation}/generer-avoir` | `annulations.creer` | `factures.creer` |
| `GET annulations/client/{clientId}` | `annulations.voir` | `clients.voir` |
| `GET annulations/avoirs/client/{clientId}` | `annulations.voir` | `clients.voir` |

### 2. Vérifier que les permissions existent dans la config

Les permissions `ordres.annuler`, `factures.annuler`, `devis.annuler` existent déjà dans `config/permissions.php` :

```text
ordres -> specific_actions: ['valider', 'annuler', ...]
factures -> specific_actions: ['valider', 'annuler', ...]
devis -> specific_actions: ['valider', 'annuler', ...]
```

Elles devraient donc déjà être en base si le seeder a été exécuté.

### 3. Ajouter les permissions aux rôles concernés

Mettre à jour `config/permissions.php` pour s'assurer que les rôles sélectionnés ont les permissions d'annulation :

| Rôle | Permissions à ajouter |
|------|----------------------|
| **comptable** | `ordres.annuler`, `factures.annuler`, `devis.annuler` |
| **commercial** | `ordres.annuler`, `devis.annuler` |
| **caissier** | `ordres.annuler` (si applicable) |

Les rôles `administrateur` et `directeur` ont déjà toutes les permissions (`permissions: 'all'`).

---

## Étapes après déploiement

1. Déployer le backend avec les modifications
2. Exécuter les commandes sur le serveur :
   ```bash
   php artisan permission:cache-reset
   php artisan db:seed --class=RolesAndPermissionsSeeder
   ```
3. Tester l'annulation d'un ordre de travail

---

## Fichiers modifiés

1. `backend/routes/api.php` - Mise à jour des middlewares de permission
2. `backend/config/permissions.php` - Ajout des permissions d'annulation aux rôles concernés

---

## Section technique

### Détail de l'erreur

```
Spatie\Permission\Exceptions\PermissionDoesNotExist:
There is no permission named `annulations.creer` for guard `web`.
```

Cette erreur est lancée par le middleware `CheckPermission` lorsqu'il appelle `hasPermissionTo('annulations.creer')` sur l'utilisateur. Spatie Permission vérifie d'abord que la permission existe en base, et lance une exception si ce n'est pas le cas.

### Pourquoi la permission n'existe pas ?

Le seeder `RolesAndPermissionsSeeder` génère les permissions à partir de `config/permissions.php`. Ce fichier définit les modules (`clients`, `devis`, `ordres`, `factures`, etc.) mais **pas de module `annulations`**.

### Alternative non retenue

On aurait pu ajouter un module `annulations` dans la config :

```php
'annulations' => [
    'label' => 'Annulations',
    'category' => 'finance',
    'global_actions' => ['voir', 'creer', 'modifier'],
    'specific_actions' => ['valider'],
],
```

Mais l'utilisateur a préféré utiliser les permissions des documents pour plus de cohérence.
