<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'name', 'legal_name', 'tax_id', 'tax_id_type', 'logo_url', 'website',
        'phone', 'email', 'address', 'city', 'state', 'country',
        'currency_code', 'timezone', 'fiscal_year_start', 'is_active', 'config',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'fiscal_year_start' => 'date',
        'config' => 'json',
    ];

    public function users() { return $this->hasMany(User::class); }
    public function sucursales() { return $this->hasMany(Sucursal::class); }
    public function warehouses() { return $this->hasMany(Warehouse::class); }
    public function roles() { return $this->hasMany(Role::class); }
    public function products() { return $this->hasMany(Product::class); }
    public function customers() { return $this->hasMany(Customer::class); }
    public function suppliers() { return $this->hasMany(Supplier::class); }
    public function sales() { return $this->hasMany(Sale::class); }
    public function purchases() { return $this->hasMany(Purchase::class); }
    public function accountsChart() { return $this->hasMany(AccountChart::class); }
    public function journalEntries() { return $this->hasMany(JournalEntry::class); }
}
