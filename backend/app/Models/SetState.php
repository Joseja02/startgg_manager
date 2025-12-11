<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SetState extends Model
{
    protected $table = 'set_states';

    protected $fillable = [
        'set_id',
        'p1_choice',
        'p2_choice',
        'bans',
        'final_stage',
        'phase', // 'rps', 'banning', 'picked', 'finished'
    ];

    protected $casts = [
        'bans' => 'array',
    ];
}
