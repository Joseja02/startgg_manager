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
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            
            // Relación con el reporte
            $table->foreignId('report_id')->constrained()->onDelete('cascade');
            
            // Número del game dentro del set (1, 2, 3...)
            $table->integer('game_index');
            
            // Stage seleccionado
            $table->string('stage');
            
            // Ganador del game
            $table->enum('winner', ['p1', 'p2']);
            
            // Stocks restantes
            $table->integer('stocks_p1')->default(0);
            $table->integer('stocks_p2')->default(0);
            
            // Personajes seleccionados (opcional)
            $table->string('character_p1')->nullable();
            $table->string('character_p2')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Índices
            $table->index(['report_id', 'game_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
