<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JournalEntry extends Model
{
    use SoftDeletes, HasUuid;

    protected $fillable = [
        'company_id', 'entry_number', 'description', 'entry_date',
        'reference_type', 'reference_id',
        'currency_code', 'exchange_rate',
        'total_debit', 'total_credit', 'status',
        'created_by',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'exchange_rate' => 'decimal:6',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function lines() { return $this->hasMany(JournalLine::class); }
}
