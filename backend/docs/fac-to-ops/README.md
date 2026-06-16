# Synchronisation FAC → OPS (Opérations Indépendantes)

Flux **unidirectionnel** : quand Facturation crée un Ordre de Travail de catégorie
**Opérations Indépendantes**, il apparaît automatiquement dans l'application OPS,
qui propose alors **Ignorer** ou **Valider**. La validation est interne à OPS et
n'est **pas** renvoyée à Facturation.

```
┌──────────────────────────┐                ┌───────────────────────────┐
│      FACTURATION (FAC)   │                │           OPS             │
│                          │                │                           │
│  ordres_travail          │                │  Liste "À valider"        │
│  + lignes_ordres         │                │  (lit la vue toutes les   │
│  + clients / armateurs   │                │   N secondes)             │
│            │             │                │            ▲              │
│            ▼             │                │            │              │
│   VUE  v_ops_independantes  ◄─────────────│  user MySQL  ops_reader   │
│   (read-only, aplatie)   │   SELECT only  │  (READ ONLY)              │
└──────────────────────────┘                └───────────────────────────┘
```

## 1. Créer l'utilisateur MySQL `ops_reader` sur la DB Facturation

À exécuter sur MySQL en tant que root :

```sql
-- backend/docs/fac-to-ops/sql/create-ops-reader-user.sql
DROP USER IF EXISTS 'ops_reader'@'localhost';
CREATE USER 'ops_reader'@'localhost' IDENTIFIED BY 'ChangeMoiMotDePasseFort!';

-- Lecture seule sur la vue dédiée
GRANT SELECT ON logiwkuh_fac.v_ops_independantes TO 'ops_reader'@'localhost';

FLUSH PRIVILEGES;
```

> Remplacer `logiwkuh_fac` par le nom réel de la base FAC et choisir un mot de
> passe fort. Aucun GRANT supplémentaire n'est nécessaire : la vue contient
> toutes les colonnes utiles, aplaties.

## 2. Configuration `.env` côté application OPS

Ajouter dans le `.env` de l'app OPS :

```env
# Lecture des OT Opérations Indépendantes créés par FAC
FAC_DB_HOST=127.0.0.1
FAC_DB_PORT=3306
FAC_DB_DATABASE=logiwkuh_fac
FAC_DB_USERNAME=ops_reader
FAC_DB_PASSWORD=ChangeMoiMotDePasseFort!
```

## 3. Schéma exposé par la vue `v_ops_independantes`

| Colonne                | Type      | Description                                           |
|------------------------|-----------|-------------------------------------------------------|
| `ordre_id`             | bigint    | Identifiant unique FAC de l'OT                        |
| `ordre_numero`         | string    | Numéro lisible (ex: `OT-2026-00123`)                  |
| `created_at`           | datetime  | Date de création FAC                                  |
| `updated_at`           | datetime  | Date de dernière modification FAC                     |
| `statut`               | enum      | `en_cours` \| `termine` \| `facture` \| `annule`      |
| `categorie`            | string    | Toujours équivalent à `operations_independantes`      |
| `type_operation_indep` | string    | `location` \| `transport` \| `manutention` \| `double_relevage` \| `stockage` |
| `bl_numero`            | string    | Numéro BL                                             |
| `navire`               | string    | Navire                                                |
| `date_arrivee`         | date      | Date d'arrivée                                        |
| `notes`                | text      | Notes saisies dans FAC                                |
| `montant_ht`           | decimal   | Total HT FCFA                                         |
| `montant_ttc`          | decimal   | Total TTC FCFA                                        |
| `client_id`            | bigint    | ID client FAC                                         |
| `client_nom`           | string    | Nom client                                            |
| `client_ice`           | string    | ICE                                                   |
| `client_telephone`     | string    | Téléphone                                             |
| `client_email`         | string    | Email                                                 |
| `armateur_id` / `armateur_nom`         | bigint/string | Armateur (nullable)              |
| `transitaire_id` / `transitaire_nom`   | bigint/string | Transitaire (nullable)           |
| `representant_id` / `representant_nom` | bigint/string | Représentant (nullable)          |
| `lignes`               | JSON      | Tableau des lignes de prestation                      |

### Format de `lignes` (JSON)

```json
[
  {
    "id": 4521,
    "description": "Transport conteneur 40' Owendo → Libreville",
    "lieu_depart": "Port d'Owendo",
    "lieu_arrivee": "Libreville",
    "date_debut": "2026-06-16",
    "date_fin": "2026-06-16",
    "quantite": 1,
    "prix_unitaire": 450000,
    "montant_ht": 450000
  }
]
```

## 4. Cas d'usage côté OPS

```sql
-- Liste des OT à valider (créés ou modifiés depuis la dernière exécution)
SELECT *
FROM v_ops_independantes
WHERE statut IN ('en_cours', 'termine')
  AND updated_at > :last_sync_at
ORDER BY created_at DESC;
```

### Actions OPS

- **Ignorer** : OPS stocke localement l'`ordre_id` dans sa propre table d'exclusions.
  Aucune écriture vers FAC.
- **Valider** : OPS crée l'opération dans son propre schéma à partir des champs
  exposés (`type_operation_indep`, `lignes`, client, armateur, dates…).
  Stocker `ordre_id` côté OPS pour éviter les doublons à la prochaine lecture.

## 5. Activer la vue

La vue est créée par la migration :

```bash
cd backend
php artisan migrate
```

Vérifier :

```sql
SHOW CREATE VIEW v_ops_independantes\G
SELECT COUNT(*) FROM v_ops_independantes;
```

## 6. Mise à jour

La vue est recréée automatiquement à chaque exécution de la migration
(`DROP VIEW IF EXISTS` puis `CREATE VIEW`). Pour modifier les colonnes exposées,
créer une **nouvelle migration** qui refait `CREATE OR REPLACE VIEW`.
