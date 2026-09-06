<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class DocumentLoan extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_code',
        'borrower_type',
        'borrower_name',
        'organization',
        'contact_phone',
        'contact_email',
        'purpose',
        'reference_letter_no',
        'reference_doc_path',
        'loan_date',
        'expected_return_date',
        'actual_return_date',
        'loan_type',
        'status',
        'approved_by',
        'created_by',
        'notes',
        'last_reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'loan_date' => 'date',
            'expected_return_date' => 'date',
            'actual_return_date' => 'date',
            'last_reminder_sent_at' => 'datetime',
        ];
    }

    protected $appends = ['is_overdue', 'days_remaining', 'total_items', 'returned_items_count'];

    public function getIsOverdueAttribute(): bool
    {
        if (in_array($this->status, ['returned'])) {
            return false;
        }
        return $this->expected_return_date < now()->startOfDay();
    }

    public function getDaysRemainingAttribute(): int
    {
        if (in_array($this->status, ['returned'])) {
            return 0;
        }
        return (int) now()->startOfDay()->diffInDays($this->expected_return_date, false);
    }

    public function getTotalItemsAttribute(): int
    {
        return $this->items()->count();
    }

    public function getReturnedItemsCountAttribute(): int
    {
        return $this->items()->where('status', 'returned')->count();
    }

    public function items(): HasMany
    {
        return $this->hasMany(DocumentLoanItem::class, 'loan_id');
    }

    public function invoices(): HasManyThrough
    {
        return $this->hasManyThrough(Invoice::class, DocumentLoanItem::class, 'loan_id', 'id', 'id', 'invoice_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Generate sequential loan code format: LN-YYYYMM-XXXX
     */
    public static function generateLoanCode(): string
    {
        $prefix = 'LN-' . date('Ym') . '-';
        $lastLoan = self::where('loan_code', 'LIKE', $prefix . '%')
            ->orderBy('id', 'desc')
            ->first();

        if ($lastLoan) {
            $lastNumber = (int) substr($lastLoan->loan_code, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return $prefix . $newNumber;
    }
}
