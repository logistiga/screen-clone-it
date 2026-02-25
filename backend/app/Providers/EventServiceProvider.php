<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

// Events
use App\Events\FactureCreated;
use App\Events\FactureUpdated;
use App\Events\FactureDeleted;
use App\Events\PaiementCreated;
use App\Events\DevisCreated;
use App\Events\DevisConverted;
use App\Events\DevisUpdated;
use App\Events\DevisDeleted;
use App\Events\OrdreCreated;
use App\Events\OrdreUpdated;
use App\Events\OrdreDeleted;
use App\Events\ClientCreated;
use App\Events\CreditEcheanceApproaching;

// Listeners
use App\Listeners\SendFactureCreatedNotification;
use App\Listeners\HandleFactureStatusChange;
use App\Listeners\SendFactureDeletedNotification;
use App\Listeners\SendPaiementNotification;
use App\Listeners\SendDevisCreatedNotification;
use App\Listeners\SendDevisConvertedNotification;
use App\Listeners\SendDevisUpdatedNotification;
use App\Listeners\SendDevisDeletedNotification;
use App\Listeners\SendWelcomeEmail;
use App\Listeners\SendCreditAlertNotification;
use App\Listeners\InvalidateDashboardCache;
use App\Listeners\SendOrdreUpdatedNotification;
use App\Listeners\SendOrdreDeletedNotification;
use App\Listeners\SendOrdreCreatedNotification;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        // Factures
        FactureCreated::class => [
            SendFactureCreatedNotification::class,
            InvalidateDashboardCache::class,
        ],
        FactureUpdated::class => [
            HandleFactureStatusChange::class,
        ],
        FactureDeleted::class => [
            SendFactureDeletedNotification::class,
            InvalidateDashboardCache::class,
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
        DevisUpdated::class => [
            SendDevisUpdatedNotification::class,
        ],
        DevisDeleted::class => [
            SendDevisDeletedNotification::class,
        ],

        // Ordres
        OrdreCreated::class => [
            SendOrdreCreatedNotification::class,
            InvalidateDashboardCache::class,
        ],
        OrdreUpdated::class => [
            SendOrdreUpdatedNotification::class,
        ],
        OrdreDeleted::class => [
            SendOrdreDeletedNotification::class,
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

    public function boot(): void
    {
        parent::boot();
    }

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
