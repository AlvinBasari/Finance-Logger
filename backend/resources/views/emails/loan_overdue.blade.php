<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pemberitahuan Keterlambatan Pengembalian Dokumen</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #dc2626; color: #ffffff; padding: 24px 28px; }
        .header h1 { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 13px; color: #fecaca; }
        .badge { display: inline-block; background: rgba(0,0,0,0.25); color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-top: 8px; }
        .content { padding: 28px; }
        .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
        .intro { font-size: 14px; color: #475569; margin-bottom: 20px; }
        .alert-card { background: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; color: #991b1b; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
        th { background: #f8fafc; color: #475569; text-align: left; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PERINGATAN KETERLAMBATAN PENGEMBALIAN DOKUMEN</h1>
            <p>Finance & Accounting Archive Management System</p>
            <span class="badge">STATUS: TERLAMBAT / OVERDUE</span>
        </div>
        <div class="content">
            <div class="greeting">Yth. {{ $loan->borrower_name }} ({{ $loan->organization }}),</div>
            <div class="intro">
                Berdasarkan data sistem pengarsipan kami, masa peminjaman dokumen arsip dengan No. Pinjam <strong>{{ $loan->loan_code }}</strong> telah **melewati batas waktu (jatuh tempo)** yang ditentukan:
            </div>

            <div class="alert-card">
                <strong>Tanggal Jatuh Tempo:</strong> {{ $loan->expected_return_date ? $loan->expected_return_date->format('d F Y') : '-' }}<br>
                <strong>Keterlambatan:</strong> {{ abs($loan->days_remaining) }} Hari<br>
                Mohon segera mengembalikan fisik berkas ke bagian arsip/gudang hari ini untuk menghindari sanksi administratif dan menjaga audit compliance.
            </div>

            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Dokumen yang Belum Dikembalikan:</div>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Kode Tracking</th>
                        <th>Vendor & No. Invoice</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($loan->items->where('status', 'borrowed') as $index => $item)
                    <tr>
                        <td>{{ $loop->iteration }}</td>
                        <td><strong>{{ $item->invoice->tracking_code }}</strong></td>
                        <td>{{ $item->invoice->vendor_name }} ({{ $item->invoice->invoice_number ?? '-' }})</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        <div class="footer">
            Departemen Finance & Accounting - Sistem Pengarsipan Dokumen.<br>
            Harap segera hubungi Tim Finance jika ada kendala dalam proses pengembalian.
        </div>
    </div>
</body>
</html>
