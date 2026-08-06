<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id', 'sale_id', 'sucursal_id', 'customer_id',
        'invoice_type', 'tin', 'invoice_number', 'serie',
        'issue_date', 'due_date',
        'subtotal', 'tax_base', 'tax', 'iva_10', 'iva_5', 'iva_exempt',
        'discount', 'total',
        'currency_code', 'exchange_rate',
        'qr_data', 'electronic_key', 'is_electronic',
        'status', 'cancellation_reason',
    ];

    protected $casts = [
        'issue_date' => 'date', 'due_date' => 'date',
        'is_electronic' => 'boolean',
        'exchange_rate' => 'decimal:6',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function sale() { return $this->belongsTo(Sale::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function items() { return $this->hasMany(InvoiceItem::class); }
    public function payments() { return $this->hasMany(Payment::class); }
}
