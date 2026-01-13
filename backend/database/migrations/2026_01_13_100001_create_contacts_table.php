<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->string('nom');
            $table->string('fonction')->nullable();
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->boolean('est_principal')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['client_id', 'est_principal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
