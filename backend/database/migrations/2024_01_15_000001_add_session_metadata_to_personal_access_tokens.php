<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Métadonnées de session
            $table->string('ip_address', 45)->nullable()->after('expires_at');
            $table->string('user_agent', 500)->nullable()->after('ip_address');
            $table->string('device_type', 50)->nullable()->after('user_agent'); // mobile, desktop, tablet
            $table->string('browser', 100)->nullable()->after('device_type');
            $table->string('platform', 100)->nullable()->after('browser');
            $table->string('location', 255)->nullable()->after('platform'); // Ville/Pays approximatif
            
            // Tracking d'activité
            $table->timestamp('last_active_at')->nullable()->after('location');
            
            // Index pour les requêtes fréquentes
            $table->index(['tokenable_type', 'tokenable_id', 'last_active_at'], 'pat_tokenable_last_active_idx');
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropIndex('pat_tokenable_last_active_idx');
            $table->dropColumn([
                'ip_address',
                'user_agent',
                'device_type',
                'browser',
                'platform',
                'location',
                'last_active_at',
            ]);
        });
    }
};
