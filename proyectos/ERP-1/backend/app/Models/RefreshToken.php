<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class RefreshToken extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'user_id', 'token_hash', 'expires_at', 'revoked',
        'replaced_by', 'ip_address', 'user_agent',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'revoked' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
