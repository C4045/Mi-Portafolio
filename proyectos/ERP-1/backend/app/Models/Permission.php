<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = ['module', 'action', 'name', 'description'];

    public function roles() { return $this->belongsToMany(Role::class, 'role_permissions'); }
}
