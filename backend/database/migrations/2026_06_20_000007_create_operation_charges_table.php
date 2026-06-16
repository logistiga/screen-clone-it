<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('operation_charges')) return;

        Schema::create('operation_charges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operation_id');
            $table->unsignedInteger('line_position');
            $table->string('line_type', 30);
            $table->string('source', 20); // auto_transport | manual
            $table->string('libelle', 200);
            $table->unsignedBigInteger('montant_fcfa')->default(0);
            $table->text('details')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('operation_id')->references('id')->on('operations')->cascadeOnDelete();
            $table->index(['operation_id', 'line_position']);
            $table->index('source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_charges');
    }
};
