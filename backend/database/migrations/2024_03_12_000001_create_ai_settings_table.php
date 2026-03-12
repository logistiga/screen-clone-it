<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_settings', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->default('ollama'); // ollama, openai, anthropic, google
            $table->string('api_url')->nullable();
            $table->text('api_key')->nullable(); // encrypted
            $table->string('model')->default('mistral:7b');
            $table->integer('max_context_length')->default(20);
            $table->text('system_prompt')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('extra_config')->nullable(); // temperature, max_tokens, etc.
            $table->timestamps();
        });

        // Insert default Ollama config
        DB::table('ai_settings')->insert([
            'provider' => 'ollama',
            'api_url' => 'http://187.124.38.130:11434',
            'model' => 'mistral:7b',
            'max_context_length' => 20,
            'system_prompt' => "Tu es l'assistant IA de **Logistiga**, une application de gestion de facturation et logistique pour le transport maritime et le transit au Gabon. Tu es l'assistant de Omar, directeur de Logistiga. Flotte de 40 camions, port d'Owendo. Équipe: Mustapha, Georgia, Mohamed, Evans.\n\nRéponds en français, de manière professionnelle et concise. Utilise du markdown pour structurer tes réponses.",
            'is_active' => true,
            'extra_config' => json_encode(['temperature' => 0.7, 'max_tokens' => 2000]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_settings');
    }
};
