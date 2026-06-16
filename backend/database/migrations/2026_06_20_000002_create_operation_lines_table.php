<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('operation_lines')) return;

        Schema::create('operation_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operation_id');
            $table->unsignedInteger('position');
            $table->string('line_type', 30);
            $table->uuid('line_id');
            $table->unsignedBigInteger('total_ligne_fcfa')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('operation_id')->references('id')->on('operations')->cascadeOnDelete();
            $table->unique(['operation_id', 'position']);
            $table->index(['line_type', 'line_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_lines');
    }
};
