<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'company_id', 'user_id', 'action', 'module', 'table_name',
        'reference_id', 'old_data', 'new_data', 'ip_address', 'user_agent',
    ];

    protected $casts = [
        'old_data' => 'json',
        'new_data' => 'json',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function user() { return $this->belongsTo(User::class); }
}
