<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('autre_operation_lines')) return;

        Schema::create('autre_operation_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operation_id');
            $table->text('description_ligne');
            $table->unsignedInteger('quantite')->default(1);
            $table->unsignedBigInteger('prix_unitaire_fcfa')->default(0);
            $table->unsignedBigInteger('total_ligne_fcfa')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('operation_id')->references('id')->on('operations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('autre_operation_lines');
    }
};
