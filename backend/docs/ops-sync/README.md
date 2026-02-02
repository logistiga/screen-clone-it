# Synchronisation OPS → FAC (Conteneurs et Armateurs)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVEUR logistiga.pro                          │
├────────────────────────────────┬────────────────────────────────────┤
│         FACTURATION (FAC)      │           OPS (opration)           │
│                                │                                    │
│  ┌──────────────────────┐      │      ┌──────────────────────┐      │
│  │   MySQL FAC DB       │      │      │   MySQL OPS DB       │      │
│  │   (lecture/écriture) │      │      │   (source conteneurs)│      │
│  └──────────────────────┘      │      └──────────────────────┘      │
│            ▲                   │                 │                  │
│            │                   │                 ▼                  │
│  ┌─────────┴────────────┐      │      ┌─────────────────────┐       │
│  │  SyncFromOps         │◄─────┼──────│  Connexion READ     │       │
│  │  (Cron toutes les    │      │      │  ONLY (fac_reader)  │       │
│  │   5 minutes)         │      │      └─────────────────────┘       │
│  └──────────────────────┘      │                                    │
│                                │                                    │
│  Tables importées:             │      Tables sources:               │
│  - conteneurs_traites          │      - sorties (conteneurs)        │
│  - armateurs                   │      - armateurs                   │
└────────────────────────────────┴────────────────────────────────────┘
```

## Flux de données (Unidirectionnel)

**OPS → FAC uniquement**

| Donnée | Table OPS | Table FAC | Clé déduplication |
|--------|-----------|-----------|-------------------|
| Armateurs | `armateurs` | `armateurs` | `code` |
| Conteneurs terminés | `sorties` | `conteneurs_traites` | `sortie_id_externe` |

## Logique métier: Conteneurs en attente

Un conteneur apparaît dans la liste "en attente" de FAC **UNIQUEMENT** s'il n'existe pas déjà dans un ordre de travail avec la **même combinaison**:

| Critère | Table `conteneurs_traites` | Table FAC |
|---------|---------------------------|-----------|
| Nom client | `client_nom` | `clients.nom` (via `ordres_travail.client_id`) |
| Numéro BL | `numero_bl` | `ordres_travail.numero_bl` |
| Numéro conteneur | `numero_conteneur` | `conteneurs_ordres.numero` |

**Comparaison:** Insensible à la casse, ignore les espaces (UPPER/TRIM).

## Installation

### 1. Créer l'utilisateur MySQL READ ONLY

Exécuter sur MySQL en tant que root:

```sql
-- Fichier: backend/docs/ops-sync/sql/create-fac-reader-user.sql

DROP USER IF EXISTS 'fac_reader'@'localhost';

CREATE USER 'fac_reader'@'localhost' IDENTIFIED BY 'VotreMotDePasseSecurise123!';

GRANT SELECT ON logiwkuh_ops.* TO 'fac_reader'@'localhost';

FLUSH PRIVILEGES;
```

### 2. Configuration .env FAC

Ajouter dans `backend/.env`:

```env
# ============================================
# Connexion Base Logistiga OPS (READ ONLY)
# ============================================
OPS_DB_HOST=127.0.0.1
OPS_DB_PORT=3306
OPS_DB_DATABASE=logiwkuh_ops
OPS_DB_USERNAME=fac_reader
OPS_DB_PASSWORD=VotreMotDePasseSecurise123!
```

### 3. Tester la connexion

```bash
cd backend
php artisan sync:from-ops --status
```

Résultat attendu:
```
🔌 Test de connexion à la base OPS...
✅ Connexion OPS réussie
   Tables disponibles: 15
```

## Commandes disponibles

```bash
# Synchronisation complète (armateurs + conteneurs)
php artisan sync:from-ops

# Armateurs uniquement
php artisan sync:from-ops --armateurs

# Conteneurs uniquement  
php artisan sync:from-ops --conteneurs

# Mode dry-run (affiche sans modifier)
php artisan sync:from-ops --dry-run

# Tester la connexion
php artisan sync:from-ops --status
```

## Planification Cron

### Option 1: Via Laravel Schedule

Ajouter dans `backend/routes/console.php`:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('sync:from-ops')->everyFiveMinutes();
```

Puis activer le scheduler dans crontab:

```cron
* * * * * cd /chemin/vers/fac/backend && php artisan schedule:run >> /dev/null 2>&1
```

### Option 2: Cron direct

```cron
*/5 * * * * cd /chemin/vers/fac/backend && php artisan sync:from-ops >> /var/log/fac-sync.log 2>&1
```

## Logs

Les logs sont enregistrés dans:
- **Console:** Barre de progression temps réel
- **Fichier:** `storage/logs/laravel.log` (tag `[SyncFromOps]`)

Exemple de log:
```
[2026-02-02 10:30:00] local.INFO: [SyncFromOps] Synchronisation terminée {"conteneurs_imported":5,"conteneurs_skipped":120,"armateurs_imported":0,"armateurs_updated":2}
```

## Dépannage

### Erreur de connexion

```
❌ Connexion OPS échouée: SQLSTATE[HY000] [1045] Access denied
```

**Solution:** Vérifier les credentials dans `.env` et les permissions de l'utilisateur MySQL.

### Conteneur non affiché alors qu'il devrait l'être

1. Vérifier que le conteneur est bien dans `conteneurs_traites`:
   ```sql
   SELECT * FROM conteneurs_traites WHERE numero_conteneur = 'XXXX';
   ```

2. Vérifier s'il matche un OT existant:
   ```sql
   SELECT ot.numero, c.nom, ot.numero_bl, co.numero
   FROM ordres_travail ot
   JOIN clients c ON c.id = ot.client_id
   JOIN conteneurs_ordres co ON co.ordre_id = ot.id
   WHERE UPPER(TRIM(co.numero)) = UPPER(TRIM('XXXX'));
   ```

## Adaptation requise

Le fichier `SyncFromOps.php` suppose que la table OPS s'appelle `sorties`. **Adaptez les noms de colonnes** selon votre schéma OPS réel:

```php
// Ligne ~200 de SyncFromOps.php
$opsConteneurs = DB::connection('ops')
    ->table('sorties')  // ← Adapter si nécessaire
    ->select([...])
```
