<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_automations', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('declencheur');
            $table->foreignId('template_id')->constrained('email_templates')->onDelete('cascade');
            $table->integer('delai')->default(0);
            $table->enum('delai_unite', ['minutes', 'heures', 'jours'])->default('minutes');
            $table->boolean('actif')->default(true);
            $table->string('conditions', 500)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index('declencheur');
            $table->index('actif');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_automations');
    }
};
