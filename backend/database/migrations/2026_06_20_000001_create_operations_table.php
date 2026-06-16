<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('operations')) return;

        Schema::create('operations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('numero_operation', 30)->unique();
            $table->date('date_operation');

            $table->string('external_client_id', 64);
            $table->string('snapshot_client_name', 200);

            $table->string('type_marchandise', 100)->nullable();
            $table->text('description_generale')->nullable();
            $table->text('observation_interne')->nullable();

            $table->unsignedBigInteger('total_transport_fcfa')->default(0);

            $table->string('statut', 30)->default('brouillon');
            $table->timestamp('charges_validated_at')->nullable();
            $table->uuid('charges_validated_by')->nullable();

            // Lien facture (préparé pour Lot 4)
            $table->uuid('facture_id')->nullable();
            $table->string('facture_numero', 30)->nullable();

            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index('statut');
            $table->index('date_operation');
            $table->index('external_client_id');
            $table->index('charges_validated_at');
            $table->index('facture_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operations');
    }
};
