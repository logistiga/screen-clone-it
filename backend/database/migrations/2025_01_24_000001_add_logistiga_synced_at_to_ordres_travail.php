<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordres_travail', function (Blueprint $table) {
            $table->timestamp('logistiga_synced_at')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('ordres_travail', function (Blueprint $table) {
            $table->dropColumn('logistiga_synced_at');
        });
    }
};
