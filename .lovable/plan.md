

# Plan de correction : Erreurs 500 sur Armateurs et Transitaires

## Problème identifié

Les endpoints `/api/armateurs` et `/api/transitaires` retournent des erreurs 500 car leurs contrôleurs utilisent des sous-requêtes SQL complexes sans protection try-catch, contrairement au `RepresentantController` qui a déjà un fallback.

## Solution

Appliquer le même pattern try-catch fallback déjà utilisé dans `RepresentantController` aux deux autres contrôleurs pour garantir une réponse même si les calculs de statistiques échouent.

## Modifications

### 1. ArmateurController.php - Ajouter try-catch fallback

Modifier la méthode `index()` pour :
- Encapsuler la requête principale avec sous-requêtes dans un bloc `try`
- Ajouter un `catch` qui exécute une requête simplifiée sans les calculs de stats
- Logger l'erreur pour diagnostic backend

```php
public function index(Request $request): JsonResponse
{
    try {
        // Requête optimisée avec sous-requêtes stats
        $query = Armateur::query()
            ->withCount(['devis', 'ordres', 'factures'])
            ->select('armateurs.*')
            ->selectSub(...) // chiffre_affaires
            ->selectSub(...) // montant_ordres

        // ... filtres et pagination
        
    } catch (\Exception $e) {
        // Fallback sans les calculs stats
        \Log::warning('ArmateurController@index fallback: ' . $e->getMessage());
        
        $query = Armateur::query()->withCount(['devis', 'ordres', 'factures']);
        // ... filtres et pagination simplifiés
    }
}
```

### 2. TransitaireController.php - Ajouter try-catch fallback

Même modification pour la méthode `index()` :
- Encapsuler les sous-requêtes `selectRaw` (primes_dues, primes_payees) dans un try-catch
- Fallback vers une requête simple sans stats

```php
public function index(Request $request): JsonResponse
{
    try {
        // Requête optimisée avec sous-requêtes stats primes
        $query = Transitaire::query()
            ->withCount(['devis', 'ordresTravail', 'factures'])
            ->selectRaw(...) // primes_dues
            ->selectRaw(...) // primes_payees
            
    } catch (\Exception $e) {
        // Fallback sans les calculs stats
        \Log::warning('TransitaireController@index fallback: ' . $e->getMessage());
        
        $query = Transitaire::query()->withCount(['devis', 'ordresTravail', 'factures']);
    }
}
```

## Partie Technique

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `backend/app/Http/Controllers/Api/ArmateurController.php` | Ajouter try-catch fallback dans `index()` |
| `backend/app/Http/Controllers/Api/TransitaireController.php` | Ajouter try-catch fallback dans `index()` |

### Pattern utilisé (identique à RepresentantController)

```text
┌─────────────────────────────────────────┐
│ Requête principale avec stats SQL      │
│ (sous-requêtes selectSub/selectRaw)    │
└────────────────┬────────────────────────┘
                 │
          ┌──────▼──────┐
          │  Succès ?   │
          └──────┬──────┘
         ┌───────┼───────┐
         │Yes           │No
         ▼               ▼
┌────────────────┐  ┌────────────────────┐
│ Retourne       │  │ Log warning        │
│ données        │  │ Requête fallback   │
│ complètes      │  │ (sans stats)       │
└────────────────┘  └────────────────────┘
```

### Avantages
- L'API ne retourne plus d'erreur 500
- Les utilisateurs voient la liste même si les stats échouent
- Les erreurs SQL sont loggées pour diagnostic backend
- Cohérence avec le pattern déjà en place

### Post-déploiement
Après déploiement, vérifier les logs Laravel pour identifier la cause exacte de l'erreur SQL :
```bash
tail -f storage/logs/laravel.log | grep "fallback"
```

