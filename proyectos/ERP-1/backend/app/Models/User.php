<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id',
        'sucursal_id',
        'username',
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'phone',
        'avatar_url',
        'is_active',
        'must_change_password',
        'last_login_at',
        'two_factor_enabled',
        'two_factor_secret',
    ];

    protected $hidden = [
        'password_hash',
        'two_factor_secret',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
        'two_factor_enabled' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'company_id' => $this->company_id,
            'user_id' => $this->id,
        ];
    }

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->using(UserRole::class);
    }

    public function hasPermission(string $module, string $action): bool
    {
        return $this->roles()
            ->whereHas('permissions', function ($q) use ($module, $action) {
                $q->where('module', $module)->where('action', $action);
            })
            ->exists();
    }

    public function hasAnyRole(array $roleNames): bool
    {
        return $this->roles()->whereIn('name', $roleNames)->exists();
    }

    public function hasPermissionFromString(string $permission): bool
    {
        [$module, $action] = explode('.', $permission, 2);
        return $this->hasPermission($module, $action);
    }

    public function getFullNameAttribute()
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}
