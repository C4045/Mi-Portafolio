<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'invoice_id', 'product_id', 'line_number', 'description',
        'quantity', 'unit_type', 'unit_price',
        'iva_type', 'subtotal', 'tax', 'total',
    ];

    public function invoice() { return $this->belongsTo(Invoice::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
