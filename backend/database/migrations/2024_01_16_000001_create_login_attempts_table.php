<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_attempts', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('ip_address', 45);
            $table->string('user_agent')->nullable();
            $table->boolean('successful')->default(false);
            $table->timestamp('attempted_at');
            
            $table->index(['email', 'attempted_at']);
            $table->index(['ip_address', 'attempted_at']);
        });

        Schema::create('account_lockouts', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->unsignedInteger('failed_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('last_failed_attempt')->nullable();
            $table->string('unlock_token')->nullable()->unique();
            $table->timestamp('unlock_token_expires_at')->nullable();
            $table->timestamps();
            
            $table->index('locked_until');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_lockouts');
        Schema::dropIfExists('login_attempts');
    }
};
