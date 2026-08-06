<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id', 'document_type', 'document_number', 'business_name',
        'first_name', 'last_name', 'email', 'phone', 'mobile',
        'address', 'city', 'state', 'country', 'birth_date',
        'credit_limit', 'is_credit_hold', 'notes', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_credit_hold' => 'boolean',
        'birth_date' => 'date',
        'credit_limit' => 'decimal:2',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function sales() { return $this->hasMany(Sale::class); }
}
