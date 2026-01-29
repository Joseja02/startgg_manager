<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
        'event_name',
        'set_id',
        'round',
        'best_of',
        'p1_entrant_id',
        'p1_name',
        'p2_entrant_id',
        'p2_name',
        'score_p1',
        'score_p2',
        'status',
        'notes',
        'rejection_reason',
    ];

    protected $casts = [
        'event_id' => 'integer',
        'set_id' => 'string',
        'best_of' => 'integer',
        'p1_entrant_id' => 'integer',
        'p2_entrant_id' => 'integer',
        'score_p1' => 'integer',
        'score_p2' => 'integer',
    ];

    /**
     * Relación con el usuario que creó el reporte
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con los games del reporte
     */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class)->orderBy('game_index');
    }

    /**
     * Scope para reportes pendientes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope para reportes aprobados
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope para reportes rechazados
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Aprobar el reporte
     */
    public function approve(): bool
    {
        $this->status = 'approved';
        $this->rejection_reason = null;
        return $this->save();
    }

    /**
     * Rechazar el reporte
     */
    public function reject(string $reason): bool
    {
        $this->status = 'rejected';
        $this->rejection_reason = $reason;
        return $this->save();
    }
}

