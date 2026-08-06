<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id', 'sucursal_id', 'supplier_id', 'user_id',
        'document_type', 'document_serie', 'document_number',
        'order_date', 'expected_date',
        'currency_code', 'exchange_rate',
        'subtotal', 'tax', 'discount', 'total',
        'status', 'notes', 'internal_notes',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_date' => 'date',
        'exchange_rate' => 'decimal:6',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function sucursal() { return $this->belongsTo(Sucursal::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function items() { return $this->hasMany(PurchaseItem::class); }
    public function payments() { return $this->morphMany(Payment::class, 'reference'); }
}
