<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class JournalLine extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'journal_entry_id', 'account_id', 'line_number', 'description',
        'debit', 'credit', 'cost_center',
    ];

    public function journalEntry() { return $this->belongsTo(JournalEntry::class); }
    public function account() { return $this->belongsTo(AccountChart::class, 'account_id'); }
}
