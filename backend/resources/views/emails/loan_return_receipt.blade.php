<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bukti Penerimaan Pengembalian Dokumen Arsip</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #059669; color: #ffffff; padding: 24px 28px; }
        .header h1 { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 13px; color: #d1fae5; }
        .badge { display: inline-block; background: rgba(0,0,0,0.2); color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-top: 8px; }
        .content { padding: 28px; }
        .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
        .intro { font-size: 14px; color: #475569; margin-bottom: 20px; }
        .success-card { background: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; color: #065f46; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
        th { background: #f8fafc; color: #475569; text-align: left; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BUKTI PENERIMAAN PENGEMBALIAN DOKUMEN</h1>
            <p>Finance & Accounting Archive Management System</p>
            <span class="badge">No. Pinjam: {{ $loan->loan_code }}</span>
        </div>
        <div class="content">
            <div class="greeting">Yth. {{ $loan->borrower_name }} ({{ $loan->organization }}),</div>
            <div class="intro">
                Dengan ini kami mengonfirmasi bahwa berkas fisik dokumen arsip telah kami terima kembali di bagian arsip dengan rincian:
            </div>

            <div class="success-card">
                <strong>Status:</strong> Pengembalian Berhasil Diproses<br>
                <strong>Tanggal Pengembalian:</strong> {{ $loan->actual_return_date ? $loan->actual_return_date->format('d/m/Y') : date('d/m/Y') }}<br>
                Terima kasih atas kerja sama dan kepatuhan dalam pengembalian dokumen arsip.
            </div>

            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Rincian Status Dokumen yang Dikembalikan:</div>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Kode Tracking</th>
                        <th>Kondisi Fisik</th>
                        <th>Tanggal Terima</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($loan->items as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td><strong>{{ $item->invoice->tracking_code }}</strong></td>
                        <td>
                            <span style="font-weight: 600; color: {{ $item->status === 'returned' ? '#16a34a' : '#dc2626' }};">
                                {{ strtoupper($item->status) }}
                            </span>
                            @if($item->return_condition_notes)
                                <br><small style="color: #64748b;">({{ $item->return_condition_notes }})</small>
                            @endif
                        </td>
                        <td>{{ $item->returned_at ? $item->returned_at->format('d/m/Y H:i') : '-' }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        <div class="footer">
            Departemen Finance & Accounting - Sistem Pengarsipan Dokumen.<br>
            Email ini merupakan bukti sah bahwa tanggung jawab peminjaman telah diselesaikan.
        </div>
    </div>
</body>
</html>
