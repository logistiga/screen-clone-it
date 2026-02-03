
# Plan : Synchronisation intelligente des conteneurs OPS avec détection d'anomalies

## Objectif
Synchroniser les conteneurs depuis la base OPS et détecter automatiquement :
1. **Conteneurs nouveaux** : présents dans OPS mais pas encore dans FAC (à facturer)
2. **Conteneurs oubliés** : OT existe avec certains conteneurs mais d'autres du même BL/client sont absents

---

## Phase 1 : Adaptation du schéma OPS

### Étape 1.1 : Découvrir la structure réelle de la table OPS
Avant toute modification, il faut connaître les colonnes exactes de votre table `sorties` côté OPS.

**Action requise (à exécuter sur le serveur)** :
```bash
cd facturation/backend
php artisan tinker
>>> \DB::connection('ops')->select('DESCRIBE sorties');
```

Cela affichera la structure exacte de la table pour adapter le mapping.

---

## Phase 2 : Modifications Backend

### Étape 2.1 : Améliorer la commande SyncFromOps
**Fichier** : `backend/app/Console/Commands/SyncFromOps.php`

Modifications :
- Adapter les colonnes SELECT selon la structure réelle de `sorties`
- Ajouter un flag `--detect-oublies` pour lancer la détection d'anomalies
- Stocker les anomalies détectées dans une nouvelle table

### Étape 2.2 : Créer une table pour les anomalies
**Migration** : `create_conteneurs_anomalies_table`

```text
conteneurs_anomalies
├── id
├── type (enum: 'oublie', 'doublon', 'mismatch')
├── numero_conteneur
├── numero_bl
├── client_nom
├── ordre_travail_id (lien vers l'OT concerné)
├── details (JSON: infos supplémentaires)
├── statut (enum: 'non_traite', 'traite', 'ignore')
├── traite_par (user_id)
├── traite_at
└── timestamps
```

### Étape 2.3 : Ajouter un endpoint de détection
**Fichier** : `backend/app/Http/Controllers/Api/ConteneurTraiteController.php`

Nouvelle méthode `detecterAnomalies()` :
- Pour chaque combinaison (client + BL) dans OPS, compter les conteneurs
- Comparer avec le nombre de conteneurs dans l'OT correspondant côté FAC
- Si différence → créer une entrée dans `conteneurs_anomalies`

### Étape 2.4 : Créer un nouveau Resource et routes
- `AnomalieConteneurResource.php`
- Routes API pour lister/traiter les anomalies

---

## Phase 3 : Modifications Frontend

### Étape 3.1 : Ajouter une section "Anomalies" dans la page
**Fichier** : `src/pages/ConteneursEnAttente.tsx`

- Ajouter un onglet ou une section "Anomalies détectées"
- Afficher en rouge/orange les conteneurs avec écart
- Pour chaque anomalie :
  - Numéro OT existant
  - Client / BL
  - Conteneurs dans OT : X
  - Conteneurs dans OPS : Y
  - Différence : Y - X conteneurs manquants
  - Bouton "Voir les détails" → liste les numéros manquants

### Étape 3.2 : Actions sur les anomalies
- **Ajouter au OT** : Ajoute les conteneurs manquants à l'OT existant
- **Ignorer** : Marque l'anomalie comme traitée (erreur de saisie côté OPS)
- **Créer nouvel OT** : Crée un OT séparé pour ces conteneurs

### Étape 3.3 : Bouton "Synchroniser + Détecter"
- Un bouton qui :
  1. Lance la synchro des conteneurs depuis OPS
  2. Lance la détection d'anomalies
  3. Rafraîchit les listes

---

## Phase 4 : Logique de comparaison détaillée

### Algorithme de détection des "oubliés"
```text
Pour chaque combinaison unique (client_nom, numero_bl) dans OPS :
  1. Récupérer tous les conteneurs OPS avec ce client+BL
  2. Chercher l'OT correspondant dans FAC (même client + même BL)
  3. Si OT trouvé :
     a. Récupérer les conteneurs de cet OT
     b. Comparer avec les conteneurs OPS
     c. Pour chaque conteneur OPS absent de l'OT → anomalie "oublie"
  4. Si OT non trouvé :
     → Ces conteneurs restent dans "en_attente" (comportement actuel)
```

---

## Résumé des fichiers à créer/modifier

### Nouveaux fichiers
| Fichier | Description |
|---------|-------------|
| `database/migrations/..._create_conteneurs_anomalies_table.php` | Table des anomalies |
| `app/Models/ConteneurAnomalie.php` | Modèle Eloquent |
| `app/Http/Resources/ConteneurAnomalieResource.php` | Resource API |

### Fichiers à modifier
| Fichier | Modification |
|---------|--------------|
| `app/Console/Commands/SyncFromOps.php` | Adapter colonnes + détection anomalies |
| `app/Http/Controllers/Api/ConteneurTraiteController.php` | Endpoint anomalies |
| `routes/api.php` | Routes anomalies |
| `src/pages/ConteneursEnAttente.tsx` | Section anomalies UI |
| `src/lib/api/conteneurs-traites.ts` | Endpoints anomalies |

---

## Détails techniques

### Critères de comparaison (insensible casse, trim)
```sql
UPPER(TRIM(client_nom)) = UPPER(TRIM(c.nom))
UPPER(TRIM(numero_bl)) = UPPER(TRIM(ot.numero_bl))
UPPER(TRIM(numero_conteneur)) = UPPER(TRIM(co.numero))
```

### Structure JSON pour les détails d'anomalie
```json
{
  "conteneurs_ops": ["CONT001", "CONT002", "CONT003", ...],
  "conteneurs_ot": ["CONT001", "CONT002"],
  "manquants": ["CONT003", ...],
  "date_detection": "2026-02-03T10:00:00Z"
}
```

---

## Prérequis avant implémentation

**Tu dois me fournir la structure de la table `sorties` côté OPS** en exécutant :
```bash
php artisan tinker
>>> \DB::connection('ops')->select('DESCRIBE sorties');
```

Ou si la table s'appelle autrement, dis-moi le nom exact et je l'adapterai.
