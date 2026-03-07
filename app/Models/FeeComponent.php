<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeComponent extends Model
{
    protected $fillable = [
        'name',
        'code',
        'amount',
        'type',
        'is_active',
    ];
}
