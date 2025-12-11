<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SetDraft extends Model
{
    protected $table = 'set_drafts';

    protected $fillable = [
        'set_id',
        'user_id',
        'data',
        'status',
    ];

    protected $casts = [
        'data' => 'array',
    ];
}
