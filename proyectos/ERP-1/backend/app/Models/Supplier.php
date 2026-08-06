<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id', 'document_type', 'document_number', 'business_name',
        'contact_name', 'email', 'phone', 'mobile',
        'address', 'city', 'state', 'country',
        'payment_terms', 'credit_days', 'notes', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'credit_days' => 'integer',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function purchases() { return $this->hasMany(Purchase::class); }
}
