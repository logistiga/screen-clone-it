<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            if (!Schema::hasColumn('devis', 'taxes_selection')) {
                $table->json('taxes_selection')->nullable()->after('remise_montant');
            }
        });
    }

    public function down(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            if (Schema::hasColumn('devis', 'taxes_selection')) {
                $table->dropColumn('taxes_selection');
            }
        });
    }
};
