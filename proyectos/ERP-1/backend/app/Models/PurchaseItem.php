<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'purchase_id', 'product_id', 'line_number', 'description',
        'quantity', 'received_qty', 'unit_type_id', 'unit_cost',
        'discount', 'tax_rate', 'subtotal', 'tax', 'total',
    ];

    public function purchase() { return $this->belongsTo(Purchase::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
