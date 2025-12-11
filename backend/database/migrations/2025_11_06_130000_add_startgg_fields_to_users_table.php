<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'startgg_user_id')) {
                $table->string('startgg_user_id')->unique()->nullable();
            }
            if (!Schema::hasColumn('users', 'startgg_access_token')) {
                $table->text('startgg_access_token')->nullable();
            }
            if (!Schema::hasColumn('users', 'startgg_refresh_token')) {
                $table->text('startgg_refresh_token')->nullable();
            }
            if (!Schema::hasColumn('users', 'token_expires_at')) {
                $table->timestamp('token_expires_at')->nullable();
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('competitor');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
            if (Schema::hasColumn('users', 'token_expires_at')) {
                $table->dropColumn('token_expires_at');
            }
            if (Schema::hasColumn('users', 'startgg_refresh_token')) {
                $table->dropColumn('startgg_refresh_token');
            }
            if (Schema::hasColumn('users', 'startgg_access_token')) {
                $table->dropColumn('startgg_access_token');
            }
            if (Schema::hasColumn('users', 'startgg_user_id')) {
                $table->dropColumn('startgg_user_id');
            }
        });
    }
};
