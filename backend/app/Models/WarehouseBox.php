<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WarehouseBox extends Model
{
    use HasFactory;

    protected $fillable = [
        'box_number',
        'description',
        'rack_location',
        'status',
        'sealed_at',
        'received_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'sealed_at' => 'datetime',
            'received_at' => 'datetime',
        ];
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'box_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
