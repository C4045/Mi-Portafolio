<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'sale_id', 'product_id', 'line_number', 'description',
        'quantity', 'unit_type_id', 'unit_price',
        'discount', 'discount_type', 'discount_rate',
        'tax_rate', 'subtotal', 'tax', 'total',
    ];

    public function sale() { return $this->belongsTo(Sale::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
