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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            
            // Relación con el usuario que reporta
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Datos del evento y set de start.gg
            $table->bigInteger('event_id')->comment('ID del evento en start.gg');
            $table->string('event_name');
            $table->string('set_id')->comment('ID del set en start.gg (puede ser bigint o string con preview_)');
            $table->string('round'); // Winners Round 1, Losers Finals, etc.
            $table->integer('best_of')->default(3);
            
            // Participantes (datos de start.gg)
            $table->bigInteger('p1_entrant_id');
            $table->string('p1_name');
            $table->bigInteger('p2_entrant_id');
            $table->string('p2_name');
            
            // Resultado propuesto
            $table->integer('score_p1')->default(0);
            $table->integer('score_p2')->default(0);
            
            // Estado del reporte
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            
            // Notas y razón de rechazo
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Índices
            $table->index('status');
            $table->index('event_id');
            $table->index('set_id');
            $table->index(['user_id', 'set_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
