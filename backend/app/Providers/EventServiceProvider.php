<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

// Events
use App\Events\FactureCreated;
use App\Events\FactureUpdated;
use App\Events\PaiementCreated;
use App\Events\DevisCreated;
use App\Events\DevisConverted;
use App\Events\OrdreCreated;
use App\Events\ClientCreated;
use App\Events\CreditEcheanceApproaching;

// Listeners
use App\Listeners\SendFactureCreatedNotification;
use App\Listeners\HandleFactureStatusChange;
use App\Listeners\SendPaiementNotification;
use App\Listeners\SendDevisCreatedNotification;
use App\Listeners\SendDevisConvertedNotification;
use App\Listeners\SendWelcomeEmail;
use App\Listeners\SendCreditAlertNotification;
use App\Listeners\InvalidateDashboardCache;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // Factures
        FactureCreated::class => [
            SendFactureCreatedNotification::class,
            InvalidateDashboardCache::class,
        ],
        FactureUpdated::class => [
            HandleFactureStatusChange::class,
        ],

        // Paiements
        PaiementCreated::class => [
            SendPaiementNotification::class,
            InvalidateDashboardCache::class,
        ],

        // Devis
        DevisCreated::class => [
            SendDevisCreatedNotification::class,
        ],
        DevisConverted::class => [
            SendDevisConvertedNotification::class,
        ],

        // Ordres
        OrdreCreated::class => [
            InvalidateDashboardCache::class,
        ],

        // Clients
        ClientCreated::class => [
            SendWelcomeEmail::class,
        ],

        // Crédits
        CreditEcheanceApproaching::class => [
            SendCreditAlertNotification::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
