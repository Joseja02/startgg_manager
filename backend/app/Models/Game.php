<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Game extends Model
{
    protected $fillable = [
        'report_id',
        'game_index',
        'stage',
        'winner',
        'stocks_p1',
        'stocks_p2',
        'character_p1',
        'character_p2',
    ];

    protected $casts = [
        'game_index' => 'integer',
        'stocks_p1' => 'integer',
        'stocks_p2' => 'integer',
    ];

    /**
     * Relación con el reporte
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /**
     * Validar que los stocks sean correctos según el ganador
     */
    public function validateStocks(): bool
    {
        // Stocks desconocidos: no validar
        if ($this->stocks_p1 === null || $this->stocks_p2 === null) {
            return true;
        }

        if ($this->winner === 'p1') {
            return $this->stocks_p2 === 0 && $this->stocks_p1 >= 1 && $this->stocks_p1 <= 3;
        }
        
        if ($this->winner === 'p2') {
            return $this->stocks_p1 === 0 && $this->stocks_p2 >= 1 && $this->stocks_p2 <= 3;
        }
        
        return false;
    }
}

