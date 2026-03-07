<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_no',
        'student_id',
        'fee_component_id',
        'title',
        'description',
        'amount',
        'due_date',
        'status',
        'created_by',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function feeComponent(): BelongsTo
    {
        return $this->belongsTo(FeeComponent::class, 'fee_component_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
