<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\InvoiceActivityLog;
use App\Models\User;
use App\Models\WarehouseBox;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Default Users for 4 Roles
        $admin = User::updateOrCreate(
            ['email' => 'admin@finance.local'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ]
        );

        $loger = User::updateOrCreate(
            ['email' => 'loger@finance.local'],
            [
                'name' => 'Budi Santoso (Finance Logger)',
                'password' => Hash::make('password123'),
                'role' => 'loger',
            ]
        );

        $logger = User::updateOrCreate(
            ['email' => 'logger@finance.local'],
            [
                'name' => 'Budi Santoso (Finance Logger)',
                'password' => Hash::make('password123'),
                'role' => 'loger',
            ]
        );

        $fp = User::updateOrCreate(
            ['email' => 'fp@finance.local'],
            [
                'name' => 'Siti Rahma (Finance Processing)',
                'password' => Hash::make('password123'),
                'role' => 'fp',
            ]
        );

        $supervisor = User::updateOrCreate(
            ['email' => 'supervisor@finance.local'],
            [
                'name' => 'Siti Rahma (Finance Processing)',
                'password' => Hash::make('password123'),
                'role' => 'fp',
            ]
        );

        $ware = User::updateOrCreate(
            ['email' => 'ware@finance.local'],
            [
                'name' => 'Agus Priyono (Warehouse Custodian)',
                'password' => Hash::make('password123'),
                'role' => 'ware',
            ]
        );

        $warehouse = User::updateOrCreate(
            ['email' => 'warehouse@finance.local'],
            [
                'name' => 'Agus Priyono (Warehouse Custodian)',
                'password' => Hash::make('password123'),
                'role' => 'ware',
            ]
        );

        // 2. Create Sample Warehouse Boxes
        $box1 = WarehouseBox::firstOrCreate(
            ['box_number' => 'BOX-FIN-2026-0001'],
            [
                'description' => 'Arsip Invoice Vendor Logistik & Ekspedisi Periode Agustus 2026',
                'rack_location' => 'Rak A-02 / Baris 3',
                'status' => 'open',
                'created_by' => $logger->id,
            ]
        );

        $box2 = WarehouseBox::firstOrCreate(
            ['box_number' => 'BOX-FIN-2026-0002'],
            [
                'description' => 'Arsip Invoice Vendor IT & Perlengkapan Kantor Juli 2026',
                'rack_location' => 'Rak B-01 / Baris 1',
                'status' => 'stored',
                'sealed_at' => now()->subDays(10),
                'received_at' => now()->subDays(8),
                'created_by' => $warehouse->id,
            ]
        );

        // 3. Create Sample Invoices across different pipeline stages
        $sampleInvoices = [
            [
                'tracking_code' => 'REC-20260821-0001',
                'vendor_name' => 'PT Mitra Sarana Logistik',
                'sender_division' => 'Supply Chain & Logistics',
                'document_count' => 3,
                'received_date' => now()->toDateString(),
                'invoice_number' => 'INV-MSL/2026/08/042',
                'invoice_date' => now()->subDays(3)->toDateString(),
                'due_date' => now()->addDays(27)->toDateString(),
                'currency' => 'IDR',
                'subtotal' => 15000000.00,
                'tax_ppn' => 1650000.00,
                'tax_pph' => 300000.00,
                'total_amount' => 16350000.00,
                'status' => 'reconciled',
                'verification_checklist' => [
                    'faktur_pajak' => true,
                    'surat_jalan' => true,
                    'po' => true,
                    'bast' => true,
                ],
                'verification_status' => 'complete',
                'verification_notes' => 'Semua dokumen pendukung lengkap dan bertanda tangan basah.',
                'reconciliation_notes' => 'Data sesuai 100% dengan fisik dokumen.',
                'verified_by' => $logger->id,
                'reconciled_by' => $supervisor->id,
                'created_by' => $logger->id,
            ],
            [
                'tracking_code' => 'REC-20260821-0002',
                'vendor_name' => 'CV Sumber Makmur Mandiri',
                'sender_division' => 'General Affairs',
                'document_count' => 2,
                'received_date' => now()->toDateString(),
                'invoice_number' => 'INV/SMM/VIII/2026/89',
                'invoice_date' => now()->subDays(2)->toDateString(),
                'due_date' => now()->addDays(14)->toDateString(),
                'currency' => 'IDR',
                'subtotal' => 4500000.00,
                'tax_ppn' => 495000.00,
                'tax_pph' => 0.00,
                'total_amount' => 4995000.00,
                'status' => 'data_inputted',
                'verification_checklist' => [
                    'faktur_pajak' => true,
                    'surat_jalan' => true,
                    'po' => true,
                    'bast' => false,
                ],
                'verification_status' => 'complete',
                'verification_notes' => 'Lampiran lengkap.',
                'verified_by' => $logger->id,
                'created_by' => $logger->id,
            ],
            [
                'tracking_code' => 'REC-20260821-0003',
                'vendor_name' => 'PT Graha Informatika Prima',
                'sender_division' => 'Information Technology',
                'document_count' => 4,
                'received_date' => now()->toDateString(),
                'status' => 'received',
                'created_by' => $logger->id,
            ],
            [
                'tracking_code' => 'REC-20260821-0004',
                'vendor_name' => 'PT Sentosa Abadi Perkasa',
                'sender_division' => 'Procurement',
                'document_count' => 2,
                'received_date' => now()->subDays(1)->toDateString(),
                'invoice_number' => 'INV-SAP-2026-991',
                'invoice_date' => now()->subDays(5)->toDateString(),
                'due_date' => now()->addDays(25)->toDateString(),
                'currency' => 'IDR',
                'subtotal' => 28000000.00,
                'tax_ppn' => 3080000.00,
                'tax_pph' => 560000.00,
                'total_amount' => 30520000.00,
                'status' => 'boxed',
                'box_id' => $box2->id,
                'verification_status' => 'complete',
                'reconciled_by' => $supervisor->id,
                'created_by' => $logger->id,
            ],
        ];

        foreach ($sampleInvoices as $invData) {
            $inv = Invoice::firstOrCreate(
                ['tracking_code' => $invData['tracking_code']],
                $invData
            );

            InvoiceActivityLog::firstOrCreate(
                [
                    'invoice_id' => $inv->id,
                    'action' => 'Document Received',
                ],
                [
                    'user_id' => $logger->id,
                    'description' => 'Dokumen fisik diterima dan didaftarkan dengan kode ' . $inv->tracking_code,
                    'created_at' => now()->subHours(5),
                ]
            );
        }
    }
}
