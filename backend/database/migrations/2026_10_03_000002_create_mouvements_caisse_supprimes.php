<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('mouvements_caisse_supprimes')) {
            return;
        }
        Schema::create('mouvements_caisse_supprimes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('mouvement_id')->index();
            $table->string('type', 20);
            $table->string('source', 20)->nullable();
            $table->decimal('montant', 15, 2);
            $table->date('date_mouvement')->nullable();
            $table->unsignedBigInteger('banque_id')->nullable();
            $table->longText('donnees');
            $table->unsignedBigInteger('supprime_par')->nullable()->index();
            $table->timestamp('supprime_le')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvements_caisse_supprimes');
    }
};
