<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id', 'sucursal_id', 'customer_id', 'user_id',
        'document_type', 'document_serie', 'document_number',
        'issue_date', 'due_date', 'payment_term',
        'currency_code', 'exchange_rate',
        'subtotal', 'tax', 'discount', 'discount_type', 'discount_rate', 'total',
        'status', 'notes', 'internal_notes',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'exchange_rate' => 'decimal:6',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function sucursal() { return $this->belongsTo(Sucursal::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function items() { return $this->hasMany(SaleItem::class); }
    public function invoice() { return $this->hasOne(Invoice::class); }
    public function payments() { return $this->morphMany(Payment::class, 'reference'); }
}
