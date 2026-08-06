<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccountChart extends Model
{
    use SoftDeletes, HasUuid;

    protected $table = 'accounts_chart';

        'company_id', 'parent_id', 'code', 'name',
        'type', 'nature', 'is_active', 'allow_movements',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'allow_movements' => 'boolean',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function parent() { return $this->belongsTo(self::class, 'parent_id'); }
    public function children() { return $this->hasMany(self::class, 'parent_id'); }
    public function journalLines() { return $this->hasMany(JournalLine::class, 'account_id'); }
}
