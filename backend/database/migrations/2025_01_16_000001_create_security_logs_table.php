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
        Schema::create('security_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_type', 50)->index();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_email')->nullable()->index();
            $table->string('ip_address', 45)->index(); // IPv6 support
            $table->text('user_agent')->nullable();
            $table->string('method', 10);
            $table->string('path');
            $table->smallInteger('status_code')->index();
            $table->float('duration_ms')->nullable();
            $table->json('context')->nullable();
            $table->timestamps();

            // Index composite pour les requêtes fréquentes
            $table->index(['event_type', 'created_at']);
            $table->index(['ip_address', 'event_type', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_logs');
    }
};
