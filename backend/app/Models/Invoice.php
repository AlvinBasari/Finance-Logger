<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracking_code',
        'vendor_name',
        'sender_division',
        'document_count',
        'received_date',
        'invoice_number',
        'invoice_date',
        'due_date',
        'currency',
        'subtotal',
        'tax_ppn',
        'tax_pph',
        'total_amount',
        'status',
        'verification_checklist',
        'verification_status',
        'verification_notes',
        'reconciliation_notes',
        'verified_by',
        'reconciled_by',
        'box_id',
        'active_loan_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'received_date' => 'date',
            'invoice_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'tax_ppn' => 'decimal:2',
            'tax_pph' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'document_count' => 'integer',
            'verification_checklist' => 'array',
        ];
    }

    protected $appends = ['soft_file_url', 'latest_file_url', 'is_loaned', 'active_loan_summary'];

    public function getIsLoanedAttribute(): bool
    {
        return !is_null($this->active_loan_id);
    }

    public function getActiveLoanSummaryAttribute(): ?array
    {
        if (!$this->active_loan_id) {
            return null;
        }
        $loan = $this->activeLoan;
        if (!$loan) {
            return null;
        }
        return [
            'id' => $loan->id,
            'loan_code' => $loan->loan_code,
            'organization' => $loan->organization,
            'borrower_name' => $loan->borrower_name,
            'loan_date' => $loan->loan_date?->format('Y-m-d'),
            'expected_return_date' => $loan->expected_return_date?->format('Y-m-d'),
            'loan_type' => $loan->loan_type,
            'is_overdue' => $loan->is_overdue,
            'days_remaining' => $loan->days_remaining,
        ];
    }

    public function getSoftFileUrlAttribute(): ?string
    {
        $soft = $this->attachments->firstWhere('source', 'vendor_softfile');
        return $soft ? $soft->url : null;
    }

    public function getLatestFileUrlAttribute(): ?string
    {
        $scan = $this->attachments->where('source', '!=', 'vendor_softfile')->last() 
            ?? $this->attachments->last();
        return $scan ? $scan->url : null;
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(InvoiceAttachment::class, 'invoice_id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(InvoiceActivityLog::class, 'invoice_id')->orderBy('created_at', 'desc');
    }

    public function box(): BelongsTo
    {
        return $this->belongsTo(WarehouseBox::class, 'box_id');
    }

    public function activeLoan(): BelongsTo
    {
        return $this->belongsTo(DocumentLoan::class, 'active_loan_id');
    }

    public function loanItems(): HasMany
    {
        return $this->hasMany(DocumentLoanItem::class, 'invoice_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function reconciler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }

    public function logActivity(?int $userId, string $action, ?string $description = null): void
    {
        $this->activityLogs()->create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'created_at' => now(),
        ]);
    }
}
