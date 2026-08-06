<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id', 'payment_type', 'reference_type', 'reference_id',
        'customer_id', 'supplier_id', 'invoice_id',
        'amount', 'payment_method', 'payment_date',
        'reference_number', 'bank_account', 'notes', 'user_id',
    ];

    protected $casts = [
        'payment_date' => 'date',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function invoice() { return $this->belongsTo(Invoice::class); }
}
