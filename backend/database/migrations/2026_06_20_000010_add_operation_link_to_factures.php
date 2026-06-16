<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('factures')) return;

        Schema::table('factures', function (Blueprint $table) {
            if (!Schema::hasColumn('factures', 'operation_id')) {
                $table->uuid('operation_id')->nullable()->after('id');
                $table->index('operation_id');
            }
            if (!Schema::hasColumn('factures', 'operation_numero')) {
                $table->string('operation_numero', 30)->nullable()->after('operation_id');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('factures')) return;
        Schema::table('factures', function (Blueprint $table) {
            if (Schema::hasColumn('factures', 'operation_numero')) $table->dropColumn('operation_numero');
            if (Schema::hasColumn('factures', 'operation_id')) {
                $table->dropIndex(['operation_id']);
                $table->dropColumn('operation_id');
            }
        });
    }
};
