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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->nullable()->index();
            $table->string('type')->default('string');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Ajouter quelques paramètres par défaut
        $defaultSettings = [
            [
                'key' => 'mail.from_name',
                'value' => 'LOJISTIGA',
                'group' => 'mail',
                'type' => 'string',
                'description' => 'Nom de l\'expéditeur des emails',
            ],
            [
                'key' => 'mail.from_address',
                'value' => 'contact@lojistiga.com',
                'group' => 'mail',
                'type' => 'string',
                'description' => 'Adresse email de l\'expéditeur',
            ],
            [
                'key' => 'mail.signature',
                'value' => "L'équipe LOJISTIGA\nTél: +221 XX XXX XX XX\nEmail: contact@lojistiga.com",
                'group' => 'mail',
                'type' => 'string',
                'description' => 'Signature des emails',
            ],
            [
                'key' => 'mail.ssl',
                'value' => '1',
                'group' => 'mail',
                'type' => 'boolean',
                'description' => 'Utiliser SSL pour SMTP',
            ],
        ];

        foreach ($defaultSettings as $setting) {
            \App\Models\Setting::create($setting);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
