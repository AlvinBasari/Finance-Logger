<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentLoanItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_id',
        'invoice_id',
        'original_box_id',
        'status',
        'returned_at',
        'return_condition_notes',
        'checked_by',
    ];

    protected function casts(): array
    {
        return [
            'returned_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(DocumentLoan::class, 'loan_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function originalBox(): BelongsTo
    {
        return $this->belongsTo(WarehouseBox::class, 'original_box_id');
    }

    public function checker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_by');
    }
}
