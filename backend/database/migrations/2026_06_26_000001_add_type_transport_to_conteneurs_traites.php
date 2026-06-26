<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('conteneurs_traites') && !Schema::hasColumn('conteneurs_traites', 'type_transport')) {
            Schema::table('conteneurs_traites', function (Blueprint $table) {
                $table->string('type_transport', 30)->nullable()->after('destination_adresse');
                $table->index('type_transport');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('conteneurs_traites') && Schema::hasColumn('conteneurs_traites', 'type_transport')) {
            Schema::table('conteneurs_traites', function (Blueprint $table) {
                $table->dropIndex(['type_transport']);
                $table->dropColumn('type_transport');
            });
        }
    }
};
