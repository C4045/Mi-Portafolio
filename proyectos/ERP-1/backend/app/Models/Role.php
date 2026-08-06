<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id', 'name', 'display_name', 'description', 'level', 'is_system', 'is_active',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'is_active' => 'boolean',
        'level' => 'integer',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function permissions() { return $this->belongsToMany(Permission::class, 'role_permissions'); }
    public function users() { return $this->belongsToMany(User::class, 'user_roles'); }
}
