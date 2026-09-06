<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\WarehouseBox;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WarehouseBoxController extends Controller
{
    /**
     * Generate Unique Box Number: BOX-FIN-YYYY-XXXX
     */
    private function generateBoxNumber(): string
    {
        $yearPrefix = 'BOX-FIN-' . date('Y') . '-';
        $latest = WarehouseBox::where('box_number', 'LIKE', "{$yearPrefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($latest) {
            $lastSeq = (int) substr($latest->box_number, -4);
            $nextSeq = str_pad($lastSeq + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $nextSeq = '0001';
        }

        return $yearPrefix . $nextSeq;
    }

    /**
     * List Warehouse Boxes with Invoices Count
     */
    public function index(Request $request): JsonResponse
    {
        $query = WarehouseBox::with(['creator:id,name'])->withCount('invoices');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('box_number', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%")
                    ->orWhere('rack_location', 'LIKE', "%{$search}%")
                    ->orWhereHas('invoices', function ($invQ) use ($search) {
                        $invQ->where('tracking_code', 'LIKE', "%{$search}%")
                            ->orWhere('invoice_number', 'LIKE', "%{$search}%")
                            ->orWhere('vendor_name', 'LIKE', "%{$search}%");
                    });
            });
        }

        $boxes = $query->orderBy('id', 'desc')->paginate($request->input('per_page', 15));

        return response()->json([
            'status' => 'success',
            'data' => $boxes,
        ]);
    }

    /**
     * Create New Warehouse Box
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'description' => 'nullable|string',
            'rack_location' => 'nullable|string|max:100',
        ]);

        $boxNumber = $this->generateBoxNumber();

        $box = WarehouseBox::create([
            'box_number' => $boxNumber,
            'description' => $request->description,
            'rack_location' => $request->rack_location,
            'status' => 'open',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Boks arsip {$box->box_number} berhasil dibuat",
            'data' => $box->load('creator:id,name'),
        ], 201);
    }

    /**
     * Show Box Detail with all contained Invoices
     */
    public function show(int $id): JsonResponse
    {
        $box = WarehouseBox::with([
            'invoices.attachments',
            'invoices.creator:id,name',
            'invoices.reconciler:id,name',
            'creator:id,name',
        ])->withCount('invoices')->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $box,
        ]);
    }

    /**
     * Add Invoice to Box (Tahap 6 Packing / Barcode Scanning)
     */
    public function addInvoice(Request $request, int $id): JsonResponse
    {
        $box = WarehouseBox::findOrFail($id);

        if ($box->status !== 'open') {
            return response()->json([
                'status' => 'error',
                'message' => 'Boks ini sudah disegel/disimpan dan tidak dapat ditambahkan invoice baru.',
            ], 422);
        }

        $request->validate([
            'invoice_id' => 'nullable|exists:invoices,id',
            'tracking_code' => 'nullable|string',
            'invoice_number' => 'nullable|string',
        ]);

        // Find invoice by ID or tracking code or invoice number
        $invoice = null;
        if ($request->filled('invoice_id')) {
            $invoice = Invoice::find($request->invoice_id);
        } elseif ($request->filled('tracking_code')) {
            $invoice = Invoice::where('tracking_code', $request->tracking_code)->first();
        } elseif ($request->filled('invoice_number')) {
            $invoice = Invoice::where('invoice_number', $request->invoice_number)->first();
        }

        if (! $invoice) {
            return response()->json([
                'status' => 'error',
                'message' => 'Dokumen invoice tidak ditemukan.',
            ], 404);
        }

        if ($invoice->status !== 'reconciled' && $invoice->status !== 'scanned') {
            return response()->json([
                'status' => 'error',
                'message' => "Invoice {$invoice->tracking_code} berstatus '{$invoice->status}'. Dokumen wajib berstatus 'reconciled' sebelum dimasukkan ke boks.",
            ], 422);
        }

        return DB::transaction(function () use ($box, $invoice, $request) {
            $invoice->update([
                'box_id' => $box->id,
                'status' => 'boxed',
            ]);

            $invoice->logActivity(
                $request->user()->id,
                'Pengemasan ke Boks (Tahap 6)',
                "Invoice dimasukkan ke dalam boks arsip {$box->box_number}."
            );

            return response()->json([
                'status' => 'success',
                'message' => "Invoice {$invoice->tracking_code} ({$invoice->vendor_name}) berhasil dimasukkan ke {$box->box_number}",
                'data' => [
                    'box' => $box->fresh()->load('invoices'),
                    'invoice' => $invoice,
                ],
            ]);
        });
    }

    /**
     * Remove Invoice from Box
     */
    public function removeInvoice(Request $request, int $id, int $invoiceId): JsonResponse
    {
        $box = WarehouseBox::findOrFail($id);

        if ($box->status !== 'open') {
            return response()->json([
                'status' => 'error',
                'message' => 'Boks sudah disegel, tidak dapat mengeluarkan dokumen.',
            ], 422);
        }

        $invoice = Invoice::where('box_id', $box->id)->findOrFail($invoiceId);

        return DB::transaction(function () use ($box, $invoice, $request) {
            $invoice->update([
                'box_id' => null,
                'status' => 'reconciled',
            ]);

            $invoice->logActivity(
                $request->user()->id,
                'Dikeluarkan dari Boks (Tahap 6)',
                "Invoice dikeluarkan dari boks {$box->box_number} untuk penyesuaian."
            );

            return response()->json([
                'status' => 'success',
                'message' => "Invoice {$invoice->tracking_code} dikeluarkan dari boks.",
            ]);
        });
    }

    /**
     * Seal Box (Kunci Boks & Siap Dikirim ke Warehouse)
     */
    public function seal(Request $request, int $id): JsonResponse
    {
        $box = WarehouseBox::withCount('invoices')->findOrFail($id);

        if ($box->invoices_count === 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Boks masih kosong dan belum dapat disegel.',
            ], 422);
        }

        $box->update([
            'status' => 'sealed',
            'sealed_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Boks {$box->box_number} berhasil disegel. Surat jalan dan label QR siap dicetak.",
            'data' => $box->fresh(['invoices']),
        ]);
    }

    /**
     * Receive Box in Warehouse (Konfirmasi Penerimaan di Gudang & Lokasi Rak)
     */
    public function receive(Request $request, int $id): JsonResponse
    {
        $box = WarehouseBox::findOrFail($id);

        $request->validate([
            'rack_location' => 'required|string|max:100',
        ]);

        return DB::transaction(function () use ($box, $request) {
            $box->update([
                'status' => 'stored',
                'rack_location' => $request->rack_location,
                'received_at' => now(),
            ]);

            // Update all invoices inside this box to archived
            Invoice::where('box_id', $box->id)->update([
                'status' => 'archived',
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Boks {$box->box_number} telah diterima di gudang arsip dan disimpan di lokasi {$request->rack_location}",
                'data' => $box->fresh(['invoices']),
            ]);
        });
    }
}
