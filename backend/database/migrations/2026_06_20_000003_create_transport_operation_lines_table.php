<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('transport_operation_lines')) return;

        Schema::create('transport_operation_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operation_id');
            $table->string('point_depart', 160);
            $table->string('point_arrivee', 160);
            $table->uuid('destination_id')->nullable();
            $table->text('description_ligne')->nullable();
            $table->string('type_transport', 40);
            $table->string('mode_trajet', 30);
            $table->unsignedInteger('quantite')->default(1);
            $table->unsignedBigInteger('prix_transport_fcfa')->default(0);
            $table->unsignedBigInteger('total_ligne_fcfa')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('operation_id')->references('id')->on('operations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_operation_lines');
    }
};
