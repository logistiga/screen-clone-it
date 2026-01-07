<?php

namespace App\Providers;

use App\Models\Armateur;
use App\Models\Banque;
use App\Models\Client;
use App\Models\CreditBancaire;
use App\Models\Devis;
use App\Models\Facture;
use App\Models\MouvementCaisse;
use App\Models\OrdreTravail;
use App\Models\Paiement;
use App\Models\Prime;
use App\Models\Representant;
use App\Models\Transitaire;
use App\Models\User;
use App\Policies\ArmateurPolicy;
use App\Policies\BanquePolicy;
use App\Policies\CaissePolicy;
use App\Policies\ClientPolicy;
use App\Policies\ConfigurationPolicy;
use App\Policies\CreditBancairePolicy;
use App\Policies\DevisPolicy;
use App\Policies\FacturePolicy;
use App\Policies\OrdreTravailPolicy;
use App\Policies\PaiementPolicy;
use App\Policies\PrimePolicy;
use App\Policies\RepresentantPolicy;
use App\Policies\TransitairePolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Client::class => ClientPolicy::class,
        Devis::class => DevisPolicy::class,
        OrdreTravail::class => OrdreTravailPolicy::class,
        Facture::class => FacturePolicy::class,
        Paiement::class => PaiementPolicy::class,
        Banque::class => BanquePolicy::class,
        MouvementCaisse::class => CaissePolicy::class,
        CreditBancaire::class => CreditBancairePolicy::class,
        Transitaire::class => TransitairePolicy::class,
        Representant::class => RepresentantPolicy::class,
        Armateur::class => ArmateurPolicy::class,
        Prime::class => PrimePolicy::class,
        User::class => UserPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Gate pour la configuration
        Gate::define('view-configuration', [ConfigurationPolicy::class, 'viewAny']);
        Gate::define('update-configuration', [ConfigurationPolicy::class, 'update']);

        // Gate pour le reporting
        Gate::define('view-reporting', function (User $user) {
            return $user->hasPermissionTo('reporting.voir');
        });

        // Super admin bypass
        Gate::before(function (User $user, string $ability) {
            if ($user->hasRole('administrateur')) {
                return true;
            }
            return null;
        });
    }
}
