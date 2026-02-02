# Synchronisation OPS → Lecture directe DB Facturation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVEUR logistiga.pro                     │
├─────────────────────────────┬───────────────────────────────┤
│         OPS (opration)      │      FACTURATION (fac)        │
│                             │                               │
│  ┌─────────────────────┐    │    ┌─────────────────────┐    │
│  │   MySQL OPS DB      │    │    │  MySQL FAC DB       │    │
│  │   (lecture/écriture)│    │    │  (source de vérité) │    │
│  └─────────────────────┘    │    └─────────────────────┘    │
│            │                │              ▲                │
│            ▼                │              │                │
│  ┌─────────────────────┐    │    ┌─────────┴─────────┐      │
│  │  SyncFromFac        │────┼────│  Connexion READ   │      │
│  │  (Cron toutes les   │    │    │  ONLY             │      │
│  │   5 minutes)        │    │    └───────────────────┘      │
│  └─────────────────────┘    │                               │
│                             │                               │
└─────────────────────────────┴───────────────────────────────┘
```

## Flux de données (Unidirectionnel)

**FAC → OPS uniquement**

| Donnée | Table FAC | Table OPS | Fréquence |
|--------|-----------|-----------|-----------|
| Clients | `clients` | `clients` | 5 min |
| Transitaires | `transitaires` | `transitaires` | 5 min |
| Armateurs | `armateurs` | `armateurs` | 5 min |
| Représentants | `representants` | `representants` | 5 min |
| Services | `services` | `services` | 5 min |

## Installation

### 1. Créer l'utilisateur MySQL READ ONLY

```sql
-- Exécuter sur MySQL en tant que root
CREATE USER 'ops_reader'@'localhost' IDENTIFIED BY 'VotreMotDePasseSecurise123!';

-- Donner accès en lecture seule à la base Facturation
GRANT SELECT ON facturation_db.* TO 'ops_reader'@'localhost';

-- Appliquer les permissions
FLUSH PRIVILEGES;
```

### 2. Configuration .env OPS

Ajouter dans `c:\xampp\htdocs\opration\backend\.env` :

```env
# Connexion READ ONLY vers la base Facturation
FAC_DB_CONNECTION=mysql
FAC_DB_HOST=127.0.0.1
FAC_DB_PORT=3306
FAC_DB_DATABASE=facturation_db
FAC_DB_USERNAME=ops_reader
FAC_DB_PASSWORD=VotreMotDePasseSecurise123!
```

### 3. Copier les fichiers dans OPS

```
opration/backend/
├── config/
│   └── database.php          # Ajouter connexion 'facturation'
├── app/
│   └── Console/
│       └── Commands/
│           └── SyncFromFacturation.php
├── routes/
│   └── console.php           # Ajouter le schedule
```

### 4. Configurer le Cron

```bash
# Ajouter à crontab -e
* * * * * cd /chemin/vers/opration/backend && php artisan schedule:run >> /dev/null 2>&1
```

## Commandes disponibles

```bash
# Synchronisation manuelle complète
php artisan sync:from-facturation

# Synchronisation d'une table spécifique
php artisan sync:from-facturation --table=clients

# Mode verbose (affiche les détails)
php artisan sync:from-facturation -v

# Mode dry-run (simule sans modifier)
php artisan sync:from-facturation --dry-run
```

## Logs

Les logs de synchronisation sont dans :
- `storage/logs/sync-facturation.log`

## Maintenance

### Vérifier l'état de la synchronisation

```bash
php artisan sync:from-facturation --status
```

### Forcer une resynchronisation complète

```bash
php artisan sync:from-facturation --force
```
