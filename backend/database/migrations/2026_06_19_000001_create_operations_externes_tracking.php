<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Table de tracking des opérations OPS (ignorées ou converties en OT)
        if (!Schema::hasTable('operations_externes_tracking')) {
            Schema::create('operations_externes_tracking', function (Blueprint $table) {
                $table->id();
                $table->string('operation_id_externe')->unique(); // ID de la ligne OPS
                $table->enum('statut', ['ignore', 'converti'])->index();
                $table->foreignId('ordre_travail_id')->nullable()->constrained('ordres_travail')->nullOnDelete();
                $table->foreignId('traite_par')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('traite_at')->nullable();
                $table->json('snapshot')->nullable(); // copie des données OPS au moment de l'action
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('operations_externes_tracking');
    }
};
