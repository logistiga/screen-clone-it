<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suspicious_logins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('ip_address', 45);
            $table->string('country_code', 5)->nullable();
            $table->string('country_name')->nullable();
            $table->string('city')->nullable();
            $table->string('region')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('reasons')->nullable();
            $table->string('action_token', 64)->unique();
            $table->timestamp('token_expires_at');
            $table->enum('status', ['pending', 'approved', 'blocked'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->foreignId('session_token_id')->nullable(); // ID du token de session à révoquer si bloqué
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['action_token', 'token_expires_at']);
            $table->index('ip_address');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suspicious_logins');
    }
};
