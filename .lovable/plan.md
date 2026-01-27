
# Plan d'Implémentation - Synchronisation Facturation vers OPS

## Objectif

Implémenter les modifications côté **Facturation** pour envoyer automatiquement vers **OPS** :
- Les **Clients** (à la création/modification)
- Les **Transitaires** (à la création/modification)  
- Les **Lots conventionnels** (à la création d'un OT conventionnel)
- Les **Conteneurs** (format mis à jour selon le contrat API)

## Fichiers à modifier/créer

| Fichier | Action | Description |
|---------|--------|-------------|
| `backend/app/Services/LogistigaApiService.php` | Modifier | Ajouter `sendRequest()`, `syncClient()`, `syncTransitaire()`, `sendLotsConventionnels()`, `getArmateursOptions()` + adapter format webhook |
| `backend/app/Observers/ClientObserver.php` | Modifier | Ajouter injection `LogistigaApiService` + sync OPS sur created/updated |
| `backend/app/Observers/TransitaireObserver.php` | **Créer** | Nouvel observer pour sync transitaires |
| `backend/app/Providers/AppServiceProvider.php` | Modifier | Enregistrer les 2 observers |
| `backend/app/Services/OrdreTravail/OrdreServiceFactory.php` | Modifier | Ajouter `envoyerLotsVersLogistiga()` pour conventionnel |
| `backend/app/Console/Commands/SyncToOpsCommand.php` | **Créer** | Commande sync initiale (optionnel) |

---

## Phase 1 : Mettre à jour LogistigaApiService

### Fichier : `backend/app/Services/LogistigaApiService.php`

**Modifications :**

1. **Ajouter méthode générique `sendRequest()`** - Factorise le code HTTP
2. **Modifier `sendOrdreTravail()`** - Nouveau format `/webhook/sorties-attente` avec `client_id`, `numero_ot`, `armateur_code`, `taille`
3. **Modifier `prepareOrdreData()`** - Adapter le format de données
4. **Ajouter `syncClient()`** - Sync client vers `/webhook/clients`
5. **Ajouter `syncTransitaire()`** - Sync transitaire vers `/webhook/transitaires`
6. **Ajouter `sendLotsConventionnels()`** - Envoi lots vers `/webhook/lots-attente`
7. **Ajouter `getArmateursOptions()`** - Récupérer armateurs depuis OPS

**Code détaillé :**

```php
// === NOUVELLE MÉTHODE GÉNÉRIQUE ===
protected function sendRequest(string $method, string $endpoint, array $data = []): array
{
    if (!$this->isSyncEnabled()) {
        Log::info('[LogistigaAPI] Sync désactivée');
        return ['success' => false, 'message' => 'Synchronisation désactivée'];
    }

    try {
        $response = Http::timeout($this->timeout)
            ->withHeaders($this->getHeaders())
            ->$method("{$this->baseUrl}{$endpoint}", $data);

        if ($response->failed()) {
            Log::error("[LogistigaAPI] Erreur {$endpoint}", [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);
            return [
                'success' => false,
                'message' => $response->json('message') ?? 'Erreur de communication',
                'status' => $response->status(),
            ];
        }

        Log::info("[LogistigaAPI] Succès {$endpoint}", ['response' => $response->json()]);
        return ['success' => true, 'data' => $response->json()];
    } catch (\Exception $e) {
        Log::error("[LogistigaAPI] Exception {$endpoint}", ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// === MODIFIER sendOrdreTravail - NOUVEAU FORMAT ===
public function sendOrdreTravail(array $data): array
{
    return $this->sendRequest('post', '/webhook/sorties-attente', [
        'external_ordre_id' => (int) ($data['external_id'] ?? 0),
        'numero_ot' => $data['numero_ot'] ?? '',
        'numero_bl' => $data['booking_number'],
        'client_id' => (int) ($data['client_id'] ?? 0),
        'client_nom' => $data['client_nom'],
        'transitaire_nom' => $data['transitaire_nom'] ?? null,
        'armateur_code' => $data['armateur_code'] ?? null,
        'containers' => collect($data['containers'])->map(fn($c) => [
            'numero_conteneur' => $c['numero_conteneur'],
            'taille' => $c['taille'] ?? '20',
            'destination' => $c['destination'] ?? null,
        ])->toArray(),
    ]);
}

// === NOUVELLES MÉTHODES ===
public function syncClient(\App\Models\Client $client): array
{
    return $this->sendRequest('post', '/webhook/clients', [
        'external_id' => $client->id,
        'code' => 'CLI-' . str_pad($client->id, 5, '0', STR_PAD_LEFT),
        'nom' => $client->nom,
        'telephone' => $client->telephone,
        'email' => $client->email,
        'adresse' => $client->adresse,
        'actif' => true,
    ]);
}

public function syncTransitaire(\App\Models\Transitaire $transitaire): array
{
    return $this->sendRequest('post', '/webhook/transitaires', [
        'external_id' => $transitaire->id,
        'code' => 'TRA-' . str_pad($transitaire->id, 5, '0', STR_PAD_LEFT),
        'nom' => $transitaire->nom,
        'contact_nom' => $transitaire->contact_principal,
        'telephone' => $transitaire->telephone,
        'email' => $transitaire->email,
        'adresse' => $transitaire->adresse,
        'actif' => $transitaire->actif ?? true,
    ]);
}

public function sendLotsConventionnels(\App\Models\OrdreTravail $ordre): array
{
    $ordre->load(['client', 'lots']);
    
    $lots = $ordre->lots ?? collect();
    if ($lots->isEmpty()) {
        return ['success' => false, 'message' => 'Aucun lot à envoyer'];
    }

    return $this->sendRequest('post', '/webhook/lots-attente', [
        'external_ordre_id' => $ordre->id,
        'numero_ot' => $ordre->numero,
        'numero_bl' => $ordre->numero_bl,
        'client_id' => $ordre->client_id,
        'client_nom' => $ordre->client->nom ?? '',
        'lots' => $lots->map(fn($l) => [
            'description' => $l->description,
            'quantite' => (float) $l->quantite,
            'unite' => 'unites',
        ])->toArray(),
    ]);
}

public function getArmateursOptions(): array
{
    return $this->sendRequest('get', '/armateurs-options');
}
```

---

## Phase 2 : Modifier ClientObserver

### Fichier : `backend/app/Observers/ClientObserver.php`

Ajouter l'injection de service et la synchronisation :

```php
<?php

namespace App\Observers;

use App\Models\Client;
use App\Events\ClientCreated;
use App\Services\LogistigaApiService;
use Illuminate\Support\Facades\Log;

class ClientObserver
{
    public function __construct(
        protected LogistigaApiService $logistigaService
    ) {}

    public function created(Client $client): void
    {
        // Event existant (email de bienvenue, etc.)
        event(new ClientCreated($client));
        
        // Sync vers OPS
        $this->syncToOps($client);
    }

    public function updated(Client $client): void
    {
        $this->syncToOps($client);
    }

    protected function syncToOps(Client $client): void
    {
        try {
            $result = $this->logistigaService->syncClient($client);
            
            if ($result['success'] ?? false) {
                Log::info('[ClientObserver] Client synchronisé vers OPS', [
                    'client_id' => $client->id,
                    'nom' => $client->nom,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('[ClientObserver] Sync OPS échouée', [
                'client_id' => $client->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
```

---

## Phase 3 : Créer TransitaireObserver

### Nouveau fichier : `backend/app/Observers/TransitaireObserver.php`

```php
<?php

namespace App\Observers;

use App\Models\Transitaire;
use App\Services\LogistigaApiService;
use Illuminate\Support\Facades\Log;

class TransitaireObserver
{
    public function __construct(
        protected LogistigaApiService $logistigaService
    ) {}

    public function created(Transitaire $transitaire): void
    {
        $this->syncToOps($transitaire);
    }

    public function updated(Transitaire $transitaire): void
    {
        $this->syncToOps($transitaire);
    }

    protected function syncToOps(Transitaire $transitaire): void
    {
        try {
            $result = $this->logistigaService->syncTransitaire($transitaire);
            
            if ($result['success'] ?? false) {
                Log::info('[TransitaireObserver] Transitaire synchronisé vers OPS', [
                    'transitaire_id' => $transitaire->id,
                    'nom' => $transitaire->nom,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('[TransitaireObserver] Sync OPS échouée', [
                'transitaire_id' => $transitaire->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
```

---

## Phase 4 : Enregistrer les Observers

### Fichier : `backend/app/Providers/AppServiceProvider.php`

Ajouter dans la méthode `boot()` :

```php
use App\Models\Client;
use App\Models\Transitaire;
use App\Observers\ClientObserver;
use App\Observers\TransitaireObserver;

public function boot(): void
{
    // ... code existant (Schema, RateLimiters) ...
    
    // Enregistrer les observers pour sync OPS
    Client::observe(ClientObserver::class);
    Transitaire::observe(TransitaireObserver::class);
}
```

---

## Phase 5 : Ajouter l'envoi des lots conventionnels

### Fichier : `backend/app/Services/OrdreTravail/OrdreServiceFactory.php`

**5.1 Modifier `prepareOrdreData()` dans LogistigaApiService pour le nouveau format**

```php
public function prepareOrdreData($ordre): ?array
{
    if ($ordre->categorie !== 'conteneurs' || !$ordre->numero_bl) {
        return null;
    }

    $conteneurs = $ordre->conteneurs ?? collect();
    if ($conteneurs->isEmpty()) {
        return null;
    }

    return [
        'external_id' => (string) $ordre->id,
        'numero_ot' => $ordre->numero,
        'booking_number' => $ordre->numero_bl,
        'client_id' => $ordre->client_id,
        'client_nom' => $ordre->client->nom ?? '',
        'transitaire_nom' => $ordre->transitaire->nom ?? null,
        'armateur_code' => $ordre->armateur->code ?? null,
        'containers' => $conteneurs->map(fn($c) => [
            'numero_conteneur' => $c->numero,
            'taille' => $c->taille ?? '20',
            'destination' => $c->destination ?? null,
        ])->toArray(),
    ];
}
```

**5.2 Modifier la méthode `creer()` (après ligne 151)**

```php
// ENVOI AUTOMATIQUE VERS LOGISTIGA pour les ordres conteneurs
if ($categorie === 'conteneurs') {
    $this->envoyerVersLogistiga($ordreFrais);
}

// NOUVEAU : Envoi automatique pour les ordres conventionnel
if ($categorie === 'conventionnel') {
    $this->envoyerLotsVersLogistiga($ordreFrais);
}
```

**5.3 Ajouter la méthode `envoyerLotsVersLogistiga()`**

```php
protected function envoyerLotsVersLogistiga(OrdreTravail $ordre): void
{
    try {
        $result = $this->logistigaService->sendLotsConventionnels($ordre);
        
        if ($result['success'] ?? false) {
            $ordre->update(['logistiga_synced_at' => now()]);
            
            Log::info('[Logistiga] Lots conventionnels envoyés', [
                'ordre_id' => $ordre->id,
                'numero' => $ordre->numero,
                'nb_lots' => $ordre->lots->count(),
            ]);
        } else {
            Log::warning('[Logistiga] Échec envoi lots', [
                'ordre_id' => $ordre->id,
                'message' => $result['message'] ?? 'Erreur inconnue',
            ]);
        }
    } catch (\Exception $e) {
        Log::error('[Logistiga] Exception envoi lots', [
            'ordre_id' => $ordre->id,
            'error' => $e->getMessage(),
        ]);
    }
}
```

---

## Phase 6 (Optionnel) : Commande de sync initiale

### Nouveau fichier : `backend/app/Console/Commands/SyncToOpsCommand.php`

Commande artisan pour synchroniser les données existantes :

```php
<?php

namespace App\Console\Commands;

use App\Models\Client;
use App\Models\Transitaire;
use App\Services\LogistigaApiService;
use Illuminate\Console\Command;

class SyncToOpsCommand extends Command
{
    protected $signature = 'logistiga:sync-to-ops {--type=all : clients|transitaires|all}';
    protected $description = 'Synchronise les référentiels vers Logistiga OPS';

    public function handle(LogistigaApiService $service): int
    {
        $type = $this->option('type');

        if (!$service->isSyncEnabled()) {
            $this->error('Sync désactivée. Vérifiez LOGISTIGA_OPS_API_KEY');
            return Command::FAILURE;
        }

        if (in_array($type, ['clients', 'all'])) {
            $this->syncClients($service);
        }

        if (in_array($type, ['transitaires', 'all'])) {
            $this->syncTransitaires($service);
        }

        $this->info('Synchronisation terminée !');
        return Command::SUCCESS;
    }

    protected function syncClients(LogistigaApiService $service): void
    {
        $clients = Client::all();
        $bar = $this->output->createProgressBar($clients->count());
        $this->info("\nSynchronisation clients...");

        $success = 0;
        foreach ($clients as $client) {
            if ($service->syncClient($client)['success'] ?? false) $success++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$success}/{$clients->count()} clients synchronisés");
    }

    protected function syncTransitaires(LogistigaApiService $service): void
    {
        $transitaires = Transitaire::all();
        $bar = $this->output->createProgressBar($transitaires->count());
        $this->info("\nSynchronisation transitaires...");

        $success = 0;
        foreach ($transitaires as $transitaire) {
            if ($service->syncTransitaire($transitaire)['success'] ?? false) $success++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$success}/{$transitaires->count()} transitaires synchronisés");
    }
}
```

**Utilisation** : `php artisan logistiga:sync-to-ops --type=all`

---

## Récapitulatif des endpoints OPS utilisés

| Endpoint | Méthode | Déclencheur | Description |
|----------|---------|-------------|-------------|
| `POST /webhook/sorties-attente` | `sendOrdreTravail()` | Création OT Conteneurs | Envoie les conteneurs |
| `POST /webhook/lots-attente` | `sendLotsConventionnels()` | Création OT Conventionnel | Envoie les lots |
| `POST /webhook/clients` | `syncClient()` | Création/Modif Client | Sync client |
| `POST /webhook/transitaires` | `syncTransitaire()` | Création/Modif Transitaire | Sync transitaire |
| `GET /armateurs-options` | `getArmateursOptions()` | Manuel | Récupère les armateurs |

---

## Points de sécurité

- **Non-bloquant** : Toutes les syncs sont dans des try/catch
- **Logging** : Chaque opération est loguée pour diagnostic
- **Authentification** : X-API-Key + Bearer token dans tous les appels
- **Idempotence** : OPS utilise `external_id` pour éviter les doublons

---

## Ordre d'implémentation

1. `LogistigaApiService.php` - Base de toutes les communications
2. `ClientObserver.php` + `TransitaireObserver.php` - Sync automatique des référentiels
3. `AppServiceProvider.php` - Enregistrer les observers
4. `OrdreServiceFactory.php` - Sync des lots conventionnels
5. `SyncToOpsCommand.php` - Sync initiale (optionnel)
