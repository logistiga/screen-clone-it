

## Correction de l'endpoint `/sync-diagnostic/health-ops`

### Problème Identifié
Le `DebugPanel.tsx` appelle `/api/sync-diagnostic/health-ops` pour tester la connexion avec Logistiga OPS, mais **cette route n'existe pas** dans le backend Laravel.

La méthode `checkHealth()` existe déjà dans `LogistigaApiService`, mais elle n'est pas exposée via une route API.

### Solution Proposée

#### 1. Ajouter la méthode `healthOps()` au `LogistigaSyncController`
Ajouter une nouvelle méthode dans `backend/app/Http/Controllers/Api/LogistigaSyncController.php` pour exposer la vérification de santé OPS :

```php
/**
 * Vérifie la connectivité avec Logistiga OPS
 */
public function healthOps(): JsonResponse
{
    $health = $this->logistigaService->checkHealth();
    
    return response()->json([
        'success' => $health['connected'] ?? false,
        'connected' => $health['connected'] ?? false,
        'status' => $health['status'] ?? 0,
        'message' => $health['message'] ?? 'Statut inconnu',
        'timestamp' => now()->toIso8601String(),
    ]);
}
```

#### 2. Créer la route dans `backend/routes/api.php`
Ajouter un groupe de routes pour le diagnostic de synchronisation :

```php
// ============================================
// SYNC DIAGNOSTIC (état de la connexion OPS)
// ============================================
Route::prefix('sync-diagnostic')->middleware('audit')->group(function () {
    Route::get('health-ops', [LogistigaSyncController::class, 'healthOps'])
        ->middleware('permission:configuration.voir');
});
```

### Fichiers à Modifier

| Fichier | Modification |
|---------|-------------|
| `backend/app/Http/Controllers/Api/LogistigaSyncController.php` | Ajouter méthode `healthOps()` |
| `backend/routes/api.php` | Ajouter route `GET /sync-diagnostic/health-ops` |

### Partie Technique

**Flux de la requête :**
```text
DebugPanel.tsx
    │
    ▼
GET /api/sync-diagnostic/health-ops
    │
    ▼
LogistigaSyncController::healthOps()
    │
    ▼
LogistigaApiService::checkHealth()
    │
    ▼
HTTP GET → https://suivitc.logistiga.com/backend/api/health
    │
    ▼
Réponse JSON { success, connected, status, message, timestamp }
```

**Permissions :** L'endpoint sera protégé par `permission:configuration.voir` pour limiter l'accès aux utilisateurs ayant les droits de configuration.

### Instructions de Déploiement
Après approbation, les fichiers backend modifiés devront être déployés sur le serveur de production pour que l'endpoint soit accessible.

