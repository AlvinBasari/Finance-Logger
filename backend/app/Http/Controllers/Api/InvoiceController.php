<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    /**
     * Generate Unique Tracking Code: REC-YYYYMMDD-XXXX
     */
    private function generateTrackingCode(): string
    {
        $todayPrefix = 'REC-' . date('Ymd') . '-';
        $latest = Invoice::where('tracking_code', 'LIKE', "{$todayPrefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($latest) {
            $lastSeq = (int) substr($latest->tracking_code, -4);
            $nextSeq = str_pad($lastSeq + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $nextSeq = '0001';
        }

        return $todayPrefix . $nextSeq;
    }

    /**
     * List Invoices with Search & Filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['attachments', 'box', 'activeLoan', 'verifier:id,name', 'reconciler:id,name', 'creator:id,name']);

        // Filter by Status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by Vendor
        if ($request->filled('vendor_name')) {
            $query->where('vendor_name', 'LIKE', '%' . $request->vendor_name . '%');
        }

        // Search query (tracking code / invoice number / vendor name)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('tracking_code', 'LIKE', "%{$search}%")
                    ->orWhere('invoice_number', 'LIKE', "%{$search}%")
                    ->orWhere('vendor_name', 'LIKE', "%{$search}%");
            });
        }

        // Filter by Date Range
        if ($request->filled('start_date')) {
            $query->whereDate('received_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('received_date', '<=', $request->end_date);
        }

        $invoices = $query->orderBy('id', 'desc')->paginate($request->input('per_page', 15));

        return response()->json([
            'status' => 'success',
            'data' => $invoices,
        ]);
    }

    /**
     * Check for Duplicate Invoice Number (Async validation)
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        $request->validate([
            'vendor_name' => 'required|string',
            'invoice_number' => 'required|string',
            'ignore_id' => 'nullable|integer',
        ]);

        $query = Invoice::where('vendor_name', $request->vendor_name)
            ->where('invoice_number', $request->invoice_number);

        if ($request->filled('ignore_id')) {
            $query->where('id', '!=', $request->ignore_id);
        }

        $exists = $query->exists();

        return response()->json([
            'status' => 'success',
            'duplicate' => $exists,
            'message' => $exists
                ? 'Nomor invoice ini sudah pernah terdaftar untuk vendor yang sama.'
                : 'Nomor invoice tersedia dan belum pernah diinput.',
        ]);
    }

    /**
     * Stage 1: Document Receipt (Penerimaan Dokumen)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'vendor_name' => 'required|string|max:255',
            'sender_division' => 'nullable|string|max:255',
            'document_count' => 'required|integer|min:1',
            'received_date' => 'required|date',
            'invoice_number' => 'nullable|string|max:150',
            'soft_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:32768',
        ]);

        return DB::transaction(function () use ($request) {
            $trackingCode = $this->generateTrackingCode();

            $invoice = Invoice::create([
                'tracking_code' => $trackingCode,
                'vendor_name' => $request->vendor_name,
                'sender_division' => $request->sender_division,
                'document_count' => $request->document_count,
                'received_date' => $request->received_date,
                'invoice_number' => $request->invoice_number,
                'status' => 'received',
                'created_by' => $request->user()->id,
            ]);

            $invoice->logActivity(
                $request->user()->id,
                'Dokumen Diterima (Tahap 1)',
                "Penerimaan fisik dokumen dari vendor {$invoice->vendor_name} sebanyak {$invoice->document_count} lembar."
            );

            if ($request->hasFile('soft_file')) {
                $file = $request->file('soft_file');
                $cleanTracking = preg_replace('/[^A-Za-z0-9_-]/', '_', $trackingCode);
                $fileName = "softfile_{$cleanTracking}_" . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('invoices', $fileName, 'public');

                $attachment = InvoiceAttachment::create([
                    'invoice_id' => $invoice->id,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getClientMimeType(),
                    'file_size_kb' => (int) round($file->getSize() / 1024),
                    'page_count' => $request->input('page_count', 1),
                    'source' => 'vendor_softfile',
                ]);

                $invoice->logActivity(
                    $request->user()->id,
                    'Unggah Soft File Vendor (Tahap 1)',
                    "Soft file vendor {$attachment->file_name} ({$attachment->file_size_kb} KB) berhasil diunggah."
                );
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Tanda terima invoice berhasil dicatat',
                'data' => $invoice->load(['creator:id,name', 'attachments']),
            ], 201);
        });
    }

    /**
     * Show Invoice Detail with attachments & logs
     */
    public function show(int $id): JsonResponse
    {
        $invoice = Invoice::with([
            'attachments',
            'activityLogs.user:id,name,role',
            'box',
            'activeLoan',
            'loanItems.loan',
            'loanItems.originalBox',
            'verifier:id,name',
            'reconciler:id,name',
            'creator:id,name',
        ])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $invoice,
        ]);
    }

    /**
     * Stage 2: Verification Checklist (Pemeriksaan Kelengkapan)
     */
    public function verify(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);

        $request->validate([
            'checklist' => 'required|array',
            'verification_status' => ['required', Rule::in(['complete', 'incomplete', 'rejected'])],
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($invoice, $request) {
            $newStatus = match ($request->verification_status) {
                'complete' => ($invoice->status === 'received' ? 'verified' : $invoice->status),
                'incomplete' => 'received',
                'rejected' => 'received',
            };

            $invoice->update([
                'verification_checklist' => $request->checklist,
                'verification_status' => $request->verification_status,
                'verification_notes' => $request->notes,
                'verified_by' => $request->user()->id,
                'status' => $newStatus,
            ]);

            $invoice->logActivity(
                $request->user()->id,
                'Verifikasi Kelengkapan (Tahap 2)',
                "Status verifikasi: {$request->verification_status}. Catatan: " . ($request->notes ?: '-')
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Hasil verifikasi berhasil diperbarui',
                'data' => $invoice->fresh(['verifier:id,name']),
            ]);
        });
    }

    /**
     * Stage 3: Financial & Accounting Data Input (Penginputan Data Invoice)
     */
    public function updateFinancials(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);

        $request->validate([
            'invoice_number' => [
                'required',
                'string',
                'max:150',
                Rule::unique('invoices', 'invoice_number')
                    ->where('vendor_name', $invoice->vendor_name)
                    ->ignore($invoice->id),
            ],
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'currency' => 'required|string|max:10',
            'subtotal' => 'required|numeric|min:0',
            'tax_ppn' => 'required|numeric|min:0',
            'tax_pph' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($invoice, $request) {
            $nextStatus = in_array($invoice->status, ['received', 'verified']) ? 'data_inputted' : $invoice->status;

            $invoice->update([
                'invoice_number' => $request->invoice_number,
                'invoice_date' => $request->invoice_date,
                'due_date' => $request->due_date,
                'currency' => $request->currency,
                'subtotal' => $request->subtotal,
                'tax_ppn' => $request->tax_ppn,
                'tax_pph' => $request->tax_pph ?? 0,
                'total_amount' => $request->total_amount,
                'status' => $nextStatus,
            ]);

            $invoice->logActivity(
                $request->user()->id,
                'Input Data Finansial (Tahap 3)',
                "Nomor Invoice: {$request->invoice_number}, Total: {$request->currency} " . number_format($request->total_amount, 2, ',', '.')
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Data finansial invoice berhasil disimpan',
                'data' => $invoice->fresh(),
            ]);
        });
    }

    /**
     * Stage 4: Upload Scan Result (Digitalisasi Dokumen PDF / Image)
     */
    public function uploadScan(Request $request): JsonResponse
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:32768', // up to 32MB as per NFR
            'page_count' => 'nullable|integer|min:1',
            'source' => 'nullable|string|max:50',
        ]);

        $invoice = Invoice::findOrFail($request->invoice_id);
        $file = $request->file('file');

        return DB::transaction(function () use ($invoice, $file, $request) {
            // Save file in public disk storage under invoices/
            $cleanTracking = preg_replace('/[^A-Za-z0-9_-]/', '_', $invoice->tracking_code);
            $fileName = "scan_{$cleanTracking}_" . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('invoices', $fileName, 'public');

            $attachment = InvoiceAttachment::create([
                'invoice_id' => $invoice->id,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $file->getClientMimeType(),
                'file_size_kb' => (int) round($file->getSize() / 1024),
                'page_count' => $request->input('page_count', 1),
                'source' => $request->input('source', 'scanner_flatbed'),
            ]);

            // Update status if currently in or before data_inputted
            if (in_array($invoice->status, ['received', 'verified', 'data_inputted'])) {
                $invoice->update(['status' => 'scanned']);
            }

            $invoice->logActivity(
                $request->user()->id,
                'Digitalisasi Dokumen (Tahap 4)',
                "Berkas {$attachment->file_name} ({$attachment->file_size_kb} KB, {$attachment->page_count} halaman) berhasil diunggah via {$attachment->source}."
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Berkas scan berhasil diunggah',
                'data' => [
                    'attachment' => $attachment,
                    'invoice' => $invoice->fresh(['attachments']),
                ],
            ], 201);
        });
    }

    /**
     * Stage 4 Alternative: Finalize Soft File as Valid Scan (Tanpa Scan Ulang)
     */
    public function finalizeSoftfile(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::with('attachments')->findOrFail($id);
        $softfile = $invoice->attachments->firstWhere('source', 'vendor_softfile');

        if (!$softfile) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invoice ini belum memiliki berkas soft file vendor.',
            ], 422);
        }

        return DB::transaction(function () use ($invoice, $softfile, $request) {
            if (in_array($invoice->status, ['received', 'verified', 'data_inputted'])) {
                $invoice->update(['status' => 'scanned']);
            }

            $invoice->logActivity(
                $request->user()->id,
                'Finalisasi Soft File Vendor (Tahap 4)',
                "Soft file vendor {$softfile->file_name} disetujui sebagai berkas digital final tanpa pemindaian tambahan."
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Soft file vendor berhasil difinalisasi sebagai berkas digital',
                'data' => $invoice->fresh(['attachments']),
            ]);
        });
    }

    /**
     * Stage 5: Reconciliation Split-Screen (Pengecekan Kesesuaian Data)
     */
    public function reconcile(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);

        $request->validate([
            'decision' => ['required', Rule::in(['approve', 'need_correction', 'reject'])],
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($invoice, $request) {
            if ($request->decision === 'approve') {
                $invoice->update([
                    'status' => 'reconciled',
                    'reconciliation_notes' => $request->notes,
                    'reconciled_by' => $request->user()->id,
                ]);

                $action = 'Rekonsiliasi Disetujui (Tahap 5)';
                $desc = 'Data digital dan fisik telah dicocokkan dan disetujui. Catatan: ' . ($request->notes ?: 'Sesuai');
            } else {
                // Return to data_inputted for correction
                $invoice->update([
                    'status' => 'data_inputted',
                    'reconciliation_notes' => $request->notes,
                ]);

                $action = 'Rekonsiliasi Memerlukan Koreksi (Tahap 5)';
                $desc = 'Dokumen dikembalikan ke tahap input untuk perbaikan. Catatan: ' . ($request->notes ?: 'Perlu penyesuaian');
            }

            $invoice->logActivity($request->user()->id, $action, $desc);

            return response()->json([
                'status' => 'success',
                'message' => $request->decision === 'approve'
                    ? 'Invoice berhasil direkonsiliasi dan siap dikemas ke boks arsip'
                    : 'Invoice dikembalikan ke tahap input data untuk koreksi',
                'data' => $invoice->fresh(['reconciler:id,name']),
            ]);
        });
    }

    /**
     * Dashboard Metrics & Pipeline Stage Counts
     */
    public function dashboardStats(): JsonResponse
    {
        $stats = [
            'total_invoices' => Invoice::count(),
            'received' => Invoice::where('status', 'received')->count(),
            'verified' => Invoice::where('status', 'verified')->count(),
            'data_inputted' => Invoice::where('status', 'data_inputted')->count(),
            'scanned' => Invoice::where('status', 'scanned')->count(),
            'reconciled' => Invoice::where('status', 'reconciled')->count(),
            'boxed' => Invoice::where('status', 'boxed')->count(),
            'archived' => Invoice::where('status', 'archived')->count(),
        ];

        $recentInvoices = Invoice::with(['creator:id,name'])
            ->orderBy('id', 'desc')
            ->limit(8)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'counts' => $stats,
                'recent' => $recentInvoices,
            ],
        ]);
    }
}
