<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('operation_bonuses')) return;

        Schema::create('operation_bonuses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operation_id');
            $table->unsignedInteger('line_position')->nullable();
            $table->string('line_type', 30)->nullable();
            $table->string('kind', 20); // prime | commission
            $table->string('beneficiary_type', 20); // chauffeur | responsable | autre
            $table->string('beneficiary_name', 150);
            $table->unsignedBigInteger('montant_fcfa')->default(0);
            $table->string('source', 20); // auto | manual
            $table->text('details')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->uuid('validated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('operation_id')->references('id')->on('operations')->cascadeOnDelete();
            $table->index(['operation_id', 'line_position']);
            $table->index('validated_at');
            $table->index('kind');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_bonuses');
    }
};
