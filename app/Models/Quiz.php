<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    protected $fillable = [
        'course_id',
        'lecturer_id',
        'title',
        'description',
        'duration_minutes',
        'total_questions',
        'scheduled_at',
        'due_at',
        'status',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'due_at' => 'datetime',
        'duration_minutes' => 'integer',
        'total_questions' => 'integer',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lecturer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lecturer_id');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('sort_order');
    }

    /**
     * Get the effective status of the quiz.
     * If the quiz status is 'active' but the due_at date has passed, return 'closed'.
     */
    public function getEffectiveStatus(): string
    {
        if ($this->status === 'active' && $this->due_at && now() > $this->due_at) {
            return 'closed';
        }
        return $this->status;
    }
}
