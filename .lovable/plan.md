
## Correction de la Synchronisation OPS

### Problème
L'endpoint `/sorties-traitees` n'existe pas sur `opt.logistiga.com`. L'API utilise `GET /sorties` avec des filtres.

### Solution
Modifier le service `LogistigaApiService` pour appeler le bon endpoint avec le filtre de statut approprié.

### Modifications

#### 1. `backend/app/Services/LogistigaApiService.php`

Remplacer l'appel à `/sorties-traitees` par `/sorties` avec le filtre `statut=retourne_port` :

```php
public function fetchConteneursTraites(array $filters = []): array
{
    // Utiliser GET /sorties avec filtre statut=retourne_port
    $params = array_merge([
        'statut' => 'retourne_port',  // Conteneurs retournés au port
        'per_page' => 100,
    ], $filters);
    
    return $this->sendRequest('GET', '/sorties', $params);
}
```

#### 2. `backend/app/Http/Controllers/Api/LogistigaSyncController.php`

Adapter le mapping des champs selon la structure retournée par `SortieConteneurResource` :

| Champ OPS | Champ Facturation |
|-----------|-------------------|
| `numero_conteneur` | `numero_conteneur` |
| `numero_bl` | `numero_bl` |
| `nom_client` | `client_nom` |
| `code_armateur` | `armateur_code` |
| `date_sortie` | `date_sortie` |
| `date_retour` | `date_retour` |
| `camion.plaque` | `camion_plaque` |
| `remorque.plaque` | `remorque_plaque` |
| `statut` | `statut_ops` |

### Partie Technique

**Flux de synchronisation corrigé :**
```text
DebugPanel → "Récupérer conteneurs OPS"
    │
    ▼
POST /sync-diagnostic/sync-conteneurs
    │
    ▼
LogistigaSyncController::syncConteneursFromOps()
    │
    ▼
LogistigaApiService::fetchConteneursTraites()
    │
    ▼
GET https://opt.logistiga.com/backend/api/sorties?statut=retourne_port&per_page=100
    │
    ▼
Mapping + Upsert dans conteneurs_traites
    │
    ▼
Réponse { success: true, imported: X, updated: Y }
```

### Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `backend/app/Services/LogistigaApiService.php` | Changer endpoint `/sorties-traitees` → `/sorties` avec filtre |
| `backend/app/Http/Controllers/Api/LogistigaSyncController.php` | Adapter mapping des champs |

### Instructions Post-Déploiement
1. Déployer les fichiers backend modifiés
2. Cliquer sur "Récupérer conteneurs OPS" dans le DebugPanel
3. Vérifier que les conteneurs avec statut `retourne_port` apparaissent dans la liste
