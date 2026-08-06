<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class UnitType extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = ['code', 'name', 'symbol', 'category'];

    public function products() { return $this->hasMany(Product::class); }
}
