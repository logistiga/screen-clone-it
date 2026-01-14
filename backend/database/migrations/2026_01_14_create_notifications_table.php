<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['info', 'warning', 'success', 'error'])->default('info');
            $table->string('title');
            $table->text('message');
            $table->string('icon')->nullable(); // facture, credit, devis, client, paiement, ordre
            $table->string('link')->nullable();
            $table->boolean('read')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Index pour les requêtes fréquentes
            $table->index(['user_id', 'read']);
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
