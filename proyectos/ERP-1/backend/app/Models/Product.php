<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id', 'category_id', 'unit_type_id',
        'sku', 'barcode', 'name', 'description', 'product_type',
        'cost_price', 'sale_price', 'min_stock', 'max_stock', 'current_stock',
        'is_active', 'has_iva', 'iva_percentage', 'image_url',
        'weight', 'volume', 'is_tracked',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'has_iva' => 'boolean',
        'is_tracked' => 'boolean',
        'cost_price' => 'decimal:4',
        'sale_price' => 'decimal:4',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function category() { return $this->belongsTo(Category::class); }
    public function unitType() { return $this->belongsTo(UnitType::class); }
    public function images() { return $this->hasMany(ProductImage::class); }
    public function inventoryMovements() { return $this->hasMany(InventoryMovement::class); }
    public function saleItems() { return $this->hasMany(SaleItem::class); }
    public function purchaseItems() { return $this->hasMany(PurchaseItem::class); }
}
