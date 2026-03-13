<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('primes_refusees', function (Blueprint $table) {
            $table->id();
            $table->string('prime_id');
            $table->enum('source', ['OPS', 'CNV']);
            $table->string('reference')->unique();
            $table->string('motif')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['source', 'prime_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('primes_refusees');
    }
};
