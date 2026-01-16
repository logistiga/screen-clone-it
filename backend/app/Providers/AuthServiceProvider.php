<?php

namespace App\Providers;

use App\Models\Armateur;
use App\Models\Audit;
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
use App\Policies\AuditPolicy;
use App\Policies\BanquePolicy;
use App\Policies\CaissePolicy;
use App\Policies\ClientPolicy;
use App\Policies\ConfigurationPolicy;
use App\Policies\CreditBancairePolicy;
use App\Policies\DevisPolicy;
use App\Policies\ExportPolicy;
use App\Policies\FacturePolicy;
use App\Policies\OrdreTravailPolicy;
use App\Policies\PaiementPolicy;
use App\Policies\PrimePolicy;
use App\Policies\RepresentantPolicy;
use App\Policies\RolePolicy;
use App\Policies\TransitairePolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Role;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Mapping des modèles vers leurs Policies
     * Chaque modèle doit avoir sa Policy pour prévenir les IDOR
     */
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
        Role::class => RolePolicy::class,
        Audit::class => AuditPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // =============================================
        // GATES - Vérifications d'accès globales
        // =============================================

        // Configuration système
        Gate::define('view-configuration', [ConfigurationPolicy::class, 'viewAny']);
        Gate::define('update-configuration', [ConfigurationPolicy::class, 'update']);

        // Reporting
        Gate::define('view-reporting', function (User $user) {
            return $user->hasPermissionTo('reporting.voir');
        });

        // Exports - Contrôle granulaire
        Gate::define('export-data', function (User $user) {
            return $user->hasPermissionTo('reporting.voir');
        });

        Gate::define('export-roles', function (User $user) {
            return $user->hasRole('administrateur');
        });

        Gate::define('export-financial', function (User $user) {
            return $user->hasPermissionTo('reporting.voir') && 
                   $user->hasAnyRole(['administrateur', 'directeur', 'comptable']);
        });

        Gate::define('export-tableau-de-bord', function (User $user) {
            return $user->hasPermissionTo('reporting.voir') && 
                   $user->hasAnyRole(['administrateur', 'directeur', 'comptable']);
        });

        // Gestion des rôles - ADMIN ONLY
        Gate::define('manage-roles', function (User $user) {
            return $user->hasRole('administrateur');
        });

        Gate::define('assign-role', function (User $user, User $targetUser) {
            // Seul un admin peut assigner des rôles
            if (!$user->hasRole('administrateur')) {
                return false;
            }
            // On ne peut pas modifier son propre rôle admin
            if ($user->id === $targetUser->id && $targetUser->hasRole('administrateur')) {
                return false;
            }
            return true;
        });

        // Audit - Lecture seule pour admins
        Gate::define('view-audit', function (User $user) {
            return $user->hasRole('administrateur') || 
                   $user->hasPermissionTo('audit.voir');
        });

        Gate::define('export-audit', function (User $user) {
            return $user->hasRole('administrateur');
        });

        // =============================================
        // SUPER ADMIN BYPASS
        // =============================================
        Gate::before(function (User $user, string $ability) {
            // Les administrateurs ont tous les droits
            // SAUF pour certaines actions critiques (gérées explicitement)
            $protectedAbilities = [
                'delete-self',      // Ne peut pas se supprimer
                'remove-own-admin', // Ne peut pas retirer son propre rôle admin
            ];

            if (in_array($ability, $protectedAbilities)) {
                return null; // Laisser la policy décider
            }

            if ($user->hasRole('administrateur')) {
                return true;
            }

            return null;
        });
    }
}
