<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'company_id', 'product_id', 'warehouse_id',
        'movement_type', 'reference_type', 'reference_id',
        'quantity', 'unit_cost', 'total_cost',
        'stock_before', 'stock_after', 'notes', 'user_id',
    ];

    public function product() { return $this->belongsTo(Product::class); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function user() { return $this->belongsTo(User::class); }
}
