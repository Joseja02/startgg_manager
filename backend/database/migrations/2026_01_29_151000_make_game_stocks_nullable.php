<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE games ALTER COLUMN stocks_p1 DROP DEFAULT');
            DB::statement('ALTER TABLE games ALTER COLUMN stocks_p2 DROP DEFAULT');
            DB::statement('ALTER TABLE games ALTER COLUMN stocks_p1 DROP NOT NULL');
            DB::statement('ALTER TABLE games ALTER COLUMN stocks_p2 DROP NOT NULL');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE games MODIFY stocks_p1 INT NULL');
            DB::statement('ALTER TABLE games MODIFY stocks_p2 INT NULL');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE games ALTER COLUMN stocks_p1 SET NOT NULL');
            DB::statement('ALTER TABLE games ALTER COLUMN stocks_p2 SET NOT NULL');
            DB::statement('ALTER TABLE games ALTER COLUMN stocks_p1 SET DEFAULT 0');
            DB::statement('ALTER TABLE games ALTER COLUMN stocks_p2 SET DEFAULT 0');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE games MODIFY stocks_p1 INT NOT NULL DEFAULT 0');
            DB::statement('ALTER TABLE games MODIFY stocks_p2 INT NOT NULL DEFAULT 0');
        }
    }
};

