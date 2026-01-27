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
        Schema::create('set_states', function (Blueprint $table) {
            $table->id();
            $table->string('set_id')->index();
            $table->string('p1_choice')->nullable();
            $table->string('p2_choice')->nullable();
            $table->json('bans')->nullable();
            $table->string('final_stage')->nullable();
            $table->string('phase')->default('rps');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('set_states');
    }
};
