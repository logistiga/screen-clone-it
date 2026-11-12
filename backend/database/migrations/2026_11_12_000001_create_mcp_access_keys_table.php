<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Clés d'accès MCP gérées depuis l'application (Assistant IA).
 * Seule l'empreinte SHA-256 est stockée : la clé n'est affichée qu'une fois.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('mcp_access_keys')) {
            return;
        }
        Schema::create('mcp_access_keys', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('description', 255)->nullable();
            $table->string('key_prefix', 16);
            $table->char('key_hash', 64)->unique();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mcp_access_keys');
    }
};
