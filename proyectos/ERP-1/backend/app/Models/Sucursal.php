<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sucursal extends Model
{
    use SoftDeletes, HasUuid;

    protected $table = 'sucursales';

    protected $fillable = [
        'company_id', 'code', 'name', 'address', 'phone', 'email',
        'is_headquarters', 'is_active',
    ];

    protected $casts = [
        'is_headquarters' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function warehouses() { return $this->hasMany(Warehouse::class); }
    public function users() { return $this->hasMany(User::class); }
    public function sales() { return $this->hasMany(Sale::class); }
    public function purchases() { return $this->hasMany(Purchase::class); }
    public function cajaSessions() { return $this->hasMany(CajaSession::class); }
}
