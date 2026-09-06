<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Konfirmasi Peminjaman Dokumen Arsip</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0f172a; color: #ffffff; padding: 24px 28px; }
        .header h1 { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 13px; color: #94a3b8; }
        .badge { display: inline-block; background: #3b82f6; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-top: 8px; }
        .content { padding: 28px; }
        .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
        .intro { font-size: 14px; color: #475569; margin-bottom: 20px; }
        .info-card { background: #f1f5f9; border-left: 4px solid #0f172a; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; }
        .info-grid { display: table; width: 100%; font-size: 13px; }
        .info-row { display: table-row; }
        .info-label { display: table-cell; padding: 4px 12px 4px 0; color: #64748b; font-weight: 600; width: 38%; }
        .info-val { display: table-cell; padding: 4px 0; color: #0f172a; font-weight: 600; }
        .table-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
        th { background: #f8fafc; color: #475569; text-align: left; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .due-alert { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 24px; }
        .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BERITA ACARA SERAH TERIMA PEMINJAMAN DOKUMEN</h1>
            <p>Finance & Accounting Archive Management System</p>
            <span class="badge">No. Pinjam: {{ $loan->loan_code }}</span>
        </div>
        <div class="content">
            <div class="greeting">Yth. {{ $loan->borrower_name }} ({{ $loan->organization }}),</div>
            <div class="intro">
                Dengan email ini kami mengonfirmasi bahwa permohonan peminjaman dokumen arsip fisik/digital telah disetujui dan diserahterimakan dengan rincian sebagai berikut:
            </div>

            <div class="info-card">
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-label">Peminjam / PIC</div>
                        <div class="info-val">: {{ $loan->borrower_name }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Instansi / Perusahaan</div>
                        <div class="info-val">: {{ $loan->organization }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Keperluan / Tujuan</div>
                        <div class="info-val">: {{ $loan->purpose }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">No. Surat Tugas / Izin</div>
                        <div class="info-val">: {{ $loan->reference_letter_no ?? '-' }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Tipe Peminjaman</div>
                        <div class="info-val">: {{ strtoupper($loan->loan_type) }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Tanggal Serah Terima</div>
                        <div class="info-val">: {{ $loan->loan_date ? $loan->loan_date->format('d/m/Y') : date('d/m/Y') }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Batas Pengembalian (Due Date)</div>
                        <div class="info-val" style="color: #dc2626;">: {{ $loan->expected_return_date ? $loan->expected_return_date->format('d/m/Y') : '-' }}</div>
                    </div>
                </div>
            </div>

            <div class="table-title">Daftar Dokumen Invoice yang Dipinjam ({{ $loan->items->count() }} Dokumen):</div>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Kode Tracking</th>
                        <th>Vendor & No. Invoice</th>
                        <th>Nominal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($loan->items as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td><strong>{{ $item->invoice->tracking_code }}</strong></td>
                        <td>
                            <div>{{ $item->invoice->vendor_name }}</div>
                            <small style="color: #64748b;">No: {{ $item->invoice->invoice_number ?? '-' }}</small>
                        </td>
                        <td>{{ $item->invoice->currency }} {{ number_format($item->invoice->total_amount, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="due-alert">
                <strong>Catatan Penting:</strong> Mohon menjaga keutuhan dokumen dan mengembalikan seluruh berkas fisik paling lambat pada tanggal <strong>{{ $loan->expected_return_date ? $loan->expected_return_date->format('d M Y') : '-' }}</strong>.
            </div>
        </div>
        <div class="footer">
            Email ini dikirim secara otomatis oleh Sistem Logger & Pengarsipan Invoice.<br>
            Harap simpan email ini sebagai tanda bukti serah terima resmi.
        </div>
    </div>
</body>
</html>
