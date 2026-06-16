<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('location_operation_lines')) return;

        Schema::create('location_operation_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operation_id');
            $table->uuid('location_tariff_id')->nullable(); // FK optionnelle (table tarifs pas encore créée)
            $table->string('libelle', 200);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->unsignedInteger('nombre_jours')->default(1);
            $table->unsignedBigInteger('prix_jour_fcfa')->default(0);
            $table->text('description_ligne')->nullable();
            $table->unsignedBigInteger('total_ligne_fcfa')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('operation_id')->references('id')->on('operations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('location_operation_lines');
    }
};
