<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    protected $fillable = [
        'quiz_id',
        'question_text',
        'question_type',
        'options',
        'correct_answer',
        'points',
        'sort_order',
    ];

    protected $casts = [
        'options' => 'array',
        'points' => 'integer',
        'sort_order' => 'integer',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }
}
