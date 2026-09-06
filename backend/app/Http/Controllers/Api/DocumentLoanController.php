<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\LoanConfirmationMail;
use App\Mail\LoanOverdueMail;
use App\Mail\LoanReminderMail;
use App\Mail\LoanReturnReceiptMail;
use App\Models\DocumentLoan;
use App\Models\DocumentLoanItem;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class DocumentLoanController extends Controller
{
    /**
     * Get list of document loans with search and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DocumentLoan::with([
            'creator:id,name,role',
            'approver:id,name,role',
            'items.invoice.box',
            'items.invoice.attachments',
            'items.originalBox',
            'items.checker:id,name',
        ])->latest('loan_date');

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('loan_code', 'LIKE', "%{$search}%")
                  ->orWhere('borrower_name', 'LIKE', "%{$search}%")
                  ->orWhere('organization', 'LIKE', "%{$search}%")
                  ->orWhere('purpose', 'LIKE', "%{$search}%")
                  ->orWhere('reference_letter_no', 'LIKE', "%{$search}%")
                  ->orWhereHas('items.invoice', function ($iq) use ($search) {
                      $iq->where('tracking_code', 'LIKE', "%{$search}%")
                         ->orWhere('vendor_name', 'LIKE', "%{$search}%")
                         ->orWhere('invoice_number', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Filter status
        if ($status = $request->input('status')) {
            if ($status === 'overdue') {
                $query->where('status', '!=', 'returned')
                      ->where('expected_return_date', '<', now()->startOfDay());
            } elseif ($status === 'due_soon') {
                $query->where('status', '!=', 'returned')
                      ->whereBetween('expected_return_date', [now()->startOfDay(), now()->addDays(3)->endOfDay()]);
            } else {
                $query->where('status', $status);
            }
        }

        // Filter loan type (physical / digital)
        if ($loanType = $request->input('loan_type')) {
            $query->where('loan_type', $loanType);
        }

        $perPage = (int) $request->input('per_page', 15);
        $loans = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $loans->items(),
            'meta' => [
                'current_page' => $loans->currentPage(),
                'last_page' => $loans->lastPage(),
                'per_page' => $loans->perPage(),
                'total' => $loans->total(),
            ]
        ]);
    }

    /**
     * Create a new document loan.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'borrower_type' => 'nullable|in:external,internal',
            'borrower_name' => 'required|string|max:255',
            'organization' => 'required|string|max:255',
            'contact_phone' => 'required|string|max:50',
            'contact_email' => 'nullable|email|max:150',
            'purpose' => 'required|string',
            'reference_letter_no' => 'nullable|string|max:150',
            'loan_date' => 'required|date',
            'expected_return_date' => 'required|date|after_or_equal:loan_date',
            'loan_type' => 'required|in:physical,digital',
            'notes' => 'nullable|string',
            'invoice_ids' => 'required|array|min:1',
            'invoice_ids.*' => 'required|exists:invoices,id',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $loanCode = DocumentLoan::generateLoanCode();

            $loan = DocumentLoan::create([
                'loan_code' => $loanCode,
                'borrower_type' => $validated['borrower_type'] ?? 'external',
                'borrower_name' => $validated['borrower_name'],
                'organization' => $validated['organization'],
                'contact_phone' => $validated['contact_phone'],
                'contact_email' => $validated['contact_email'] ?? null,
                'purpose' => $validated['purpose'],
                'reference_letter_no' => $validated['reference_letter_no'] ?? null,
                'loan_date' => $validated['loan_date'],
                'expected_return_date' => $validated['expected_return_date'],
                'loan_type' => $validated['loan_type'],
                'status' => 'active',
                'approved_by' => $request->user()?->id,
                'created_by' => $request->user()?->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            $invoices = Invoice::whereIn('id', $validated['invoice_ids'])->get();

            foreach ($invoices as $invoice) {
                // If invoice already active loaned, reject or override
                DocumentLoanItem::create([
                    'loan_id' => $loan->id,
                    'invoice_id' => $invoice->id,
                    'original_box_id' => $invoice->box_id,
                    'status' => 'borrowed',
                ]);

                // Update active_loan_id on invoice
                $invoice->update(['active_loan_id' => $loan->id]);

                // Log activity on invoice
                $invoice->logActivity(
                    $request->user()?->id,
                    'document_loaned',
                    "Dokumen dipinjam oleh {$loan->organization} ({$loan->borrower_name}) dengan kode {$loan->loan_code}. Batas kembali: " . date('d/m/Y', strtotime($loan->expected_return_date))
                );
            }

            // Send confirmation email if email is provided
            if (!empty($loan->contact_email)) {
                try {
                    $loan->load('items.invoice');
                    Mail::to($loan->contact_email)->send(new LoanConfirmationMail($loan));
                } catch (\Throwable $e) {
                    Log::warning("Failed to send loan confirmation email to {$loan->contact_email}: " . $e->getMessage());
                }
            }

            $loan->load([
                'creator:id,name,role',
                'approver:id,name,role',
                'items.invoice.box',
                'items.originalBox',
            ]);

            return response()->json([
                'success' => true,
                'message' => "Peminjaman dokumen {$loan->loan_code} berhasil dibuat.",
                'data' => $loan,
            ], 201);
        });
    }

    /**
     * Show loan details.
     */
    public function show(int $id): JsonResponse
    {
        $loan = DocumentLoan::with([
            'creator:id,name,role',
            'approver:id,name,role',
            'items.invoice.box',
            'items.invoice.attachments',
            'items.originalBox',
            'items.checker:id,name',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $loan,
        ]);
    }

    /**
     * Process return of documents.
     */
    public function returnItems(Request $request, int $id): JsonResponse
    {
        $loan = DocumentLoan::with(['items.invoice.box', 'items.originalBox'])->findOrFail($id);

        $validated = $request->validate([
            'actual_return_date' => 'nullable|date',
            'return_all' => 'nullable|boolean',
            'items' => 'nullable|array',
            'items.*.item_id' => 'required_with:items|exists:document_loan_items,id',
            'items.*.status' => 'required_with:items|in:returned,damaged,lost',
            'items.*.condition_notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($loan, $validated, $request) {
            $returnDate = $validated['actual_return_date'] ?? now()->toDateString();
            $userId = $request->user()?->id;

            if (!empty($validated['return_all'])) {
                // Return all unreturned items
                foreach ($loan->items as $item) {
                    if ($item->status === 'borrowed') {
                        $item->update([
                            'status' => 'returned',
                            'returned_at' => now(),
                            'return_condition_notes' => 'Lengkap dan baik',
                            'checked_by' => $userId,
                        ]);

                        // Release invoice active_loan_id
                        $item->invoice?->update(['active_loan_id' => null]);
                        $item->invoice?->logActivity(
                            $userId,
                            'document_returned',
                            "Dokumen dikembalikan dari peminjaman {$loan->loan_code}. Lokasi boks: " . ($item->originalBox?->box_number ?? 'Belum ada boks')
                        );
                    }
                }
            } elseif (!empty($validated['items'])) {
                foreach ($validated['items'] as $itemData) {
                    $item = $loan->items->firstWhere('id', $itemData['item_id']);
                    if ($item) {
                        $itemStatus = $itemData['status'] ?? 'returned';
                        $item->update([
                            'status' => $itemStatus,
                            'returned_at' => now(),
                            'return_condition_notes' => $itemData['condition_notes'] ?? null,
                            'checked_by' => $userId,
                        ]);

                        // Release invoice active_loan_id
                        $item->invoice?->update(['active_loan_id' => null]);
                        $item->invoice?->logActivity(
                            $userId,
                            'document_returned',
                            "Dokumen dikembalikan dari peminjaman {$loan->loan_code} (Status: {$itemStatus}). Catatan: " . ($itemData['condition_notes'] ?? 'Baik')
                        );
                    }
                }
            }

            // Check overall loan status
            $loan->refresh();
            $unreturnedCount = $loan->items()->where('status', 'borrowed')->count();

            if ($unreturnedCount === 0) {
                $loan->update([
                    'status' => 'returned',
                    'actual_return_date' => $returnDate,
                ]);
            } else {
                $loan->update([
                    'status' => 'partial_returned',
                ]);
            }

            // Send return receipt email if email exists
            if (!empty($loan->contact_email)) {
                try {
                    $loan->load('items.invoice');
                    Mail::to($loan->contact_email)->send(new LoanReturnReceiptMail($loan));
                } catch (\Throwable $e) {
                    Log::warning("Failed to send loan return receipt email to {$loan->contact_email}: " . $e->getMessage());
                }
            }

            $loan->load([
                'creator:id,name,role',
                'approver:id,name,role',
                'items.invoice.box',
                'items.originalBox',
                'items.checker:id,name',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pengembalian dokumen berhasil diproses.',
                'data' => $loan,
            ]);
        });
    }

    /**
     * Send email reminder / overdue alert manually.
     */
    public function sendReminder(Request $request, int $id): JsonResponse
    {
        $loan = DocumentLoan::with(['items.invoice'])->findOrFail($id);

        if (empty($loan->contact_email)) {
            return response()->json([
                'success' => false,
                'message' => 'Peminjaman ini tidak memiliki alamat email kontak terdaftar.',
            ], 422);
        }

        try {
            if ($loan->is_overdue) {
                Mail::to($loan->contact_email)->send(new LoanOverdueMail($loan));
                $type = 'Peringatan Overdue';
            } else {
                Mail::to($loan->contact_email)->send(new LoanReminderMail($loan));
                $type = 'Pengingat Jatuh Tempo';
            }

            $loan->update(['last_reminder_sent_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => "Email {$type} berhasil dikirim ke {$loan->contact_email}.",
            ]);
        } catch (\Throwable $e) {
            Log::error("Email send error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get dashboard / KPI statistics for document loans.
     */
    public function stats(): JsonResponse
    {
        $now = now()->startOfDay();
        $dueSoonDate = now()->addDays(3)->endOfDay();

        $activeLoans = DocumentLoan::where('status', 'active')->orWhere('status', 'partial_returned');

        $totalActive = (clone $activeLoans)->where('expected_return_date', '>=', $now)->count();
        $totalOverdue = DocumentLoan::where('status', '!=', 'returned')
            ->where('expected_return_date', '<', $now)
            ->count();
        $totalDueSoon = DocumentLoan::where('status', '!=', 'returned')
            ->whereBetween('expected_return_date', [$now, $dueSoonDate])
            ->count();
        $totalReturned = DocumentLoan::where('status', 'returned')->count();
        $totalLoans = DocumentLoan::count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_loans' => $totalLoans,
                'active_loans' => $totalActive,
                'due_soon_loans' => $totalDueSoon,
                'overdue_loans' => $totalOverdue,
                'returned_loans' => $totalReturned,
            ]
        ]);
    }
}
