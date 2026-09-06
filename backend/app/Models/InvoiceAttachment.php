<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class InvoiceAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size_kb',
        'page_count',
        'source',
    ];

    protected $appends = ['url'];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function getUrlAttribute(): string
    {
        return asset(Storage::url($this->file_path));
    }
}
