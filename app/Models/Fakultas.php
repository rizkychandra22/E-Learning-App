<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fakultas extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'code', 'slug'
    ];

    public function jurusans(): HasMany
    {
        return $this->hasMany(Jurusan::class);
    }
}
