<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->enum('type', ['devis', 'ordre', 'facture', 'relance', 'confirmation', 'notification', 'custom'])->default('custom');
            $table->string('objet', 500);
            $table->text('contenu');
            $table->json('variables')->nullable();
            $table->boolean('actif')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index('type');
            $table->index('actif');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
