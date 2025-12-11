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
        Schema::create('set_drafts', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('set_id')->index()->comment('ID del set en start.gg');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->json('data')->nullable()->comment('JSON con estado parcial: games, personajes, stocks, otros');
            $table->enum('status', ['draft','submitted'])->default('draft');
            $table->timestamps();

            $table->unique(['set_id','user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('set_drafts');
    }
};
