<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id', 'sucursal_id', 'code', 'name', 'location', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function company() { return $this->belongsTo(Company::class); }
    public function sucursal() { return $this->belongsTo(Sucursal::class); }
    public function inventoryMovements() { return $this->hasMany(InventoryMovement::class); }
}
