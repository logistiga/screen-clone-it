<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('factures', 'devis_id')) {
            Schema::table('factures', function (Blueprint $table) {
                $table->unsignedBigInteger('devis_id')->nullable()->after('ordre_id');
                $table->foreign('devis_id')->references('id')->on('devis')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('factures', 'devis_id')) {
            Schema::table('factures', function (Blueprint $table) {
                $table->dropForeign(['devis_id']);
                $table->dropColumn('devis_id');
            });
        }
    }
};
