import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';

export const LoanBastModal = ({ isOpen, loan, onClose }) => {
  const printContentRef = useRef(null);

  if (!isOpen || !loan) return null;

  const handlePrint = () => {
    window.print();
  };

  const isReturnBast = loan.status === 'returned';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              Preview Berita Acara Serah Terima (BAST)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center print:p-0 print:bg-white">
          <div
            ref={printContentRef}
            className="w-full max-w-2xl bg-white p-8 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 text-slate-900 font-sans"
            style={{ minHeight: '297mm' }}
          >
            {/* Header Surat */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">
                  DEPARTEMEN FINANCE & ACCOUNTING
                </h1>
                <p className="text-xs text-slate-600">Unit Pengarsipan & Manajemen Dokumen Fisik</p>
                <p className="text-[11px] text-slate-500">Sistem Logger & Traceability Berkas Keuangan</p>
              </div>
              <div className="text-right">
                <QRCodeSVG
                  value={`BAST-${loan.loan_code}-${loan.organization}`}
                  size={60}
                  level="M"
                />
                <span className="text-[9px] font-mono text-slate-400 block mt-1">VERIFIED ARSIP</span>
              </div>
            </div>

            {/* Judul BAST */}
            <div className="text-center my-4">
              <h2 className="text-sm font-bold uppercase tracking-wide underline underline-offset-4">
                {isReturnBast
                  ? 'BERITA ACARA SERAH TERIMA PENGEMBALIAN DOKUMEN ARSIP'
                  : 'BERITA ACARA SERAH TERIMA PEMINJAMAN DOKUMEN ARSIP'}
              </h2>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                Nomor: {loan.loan_code}
              </p>
            </div>

            {/* Kalimat Pembuka */}
            <div className="text-xs leading-relaxed mb-4 text-slate-700">
              Pada hari ini, tanggal{' '}
              <strong className="text-slate-900">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
              , telah dilakukan serah terima berkas dokumen arsip fisik/digital antara pihak-pihak di bawah ini:
            </div>

            {/* Pihak Pertama & Kedua */}
            <div className="space-y-3 mb-6 text-xs bg-slate-50/70 p-3.5 rounded border border-slate-200">
              <div className="grid grid-cols-12 gap-1">
                <div className="col-span-3 font-semibold text-slate-600">Nama Peminjam / PIC</div>
                <div className="col-span-9 font-bold text-slate-900">: {loan.borrower_name}</div>

                <div className="col-span-3 font-semibold text-slate-600">Instansi / Perusahaan</div>
                <div className="col-span-9 font-bold text-slate-900">: {loan.organization}</div>

                <div className="col-span-3 font-semibold text-slate-600">Kontak Telepon / Email</div>
                <div className="col-span-9 font-medium text-slate-800">
                  : {loan.contact_phone} {loan.contact_email ? `(${loan.contact_email})` : ''}
                </div>

                <div className="col-span-3 font-semibold text-slate-600">Keperluan / Tujuan</div>
                <div className="col-span-9 font-medium text-slate-800">: {loan.purpose}</div>

                <div className="col-span-3 font-semibold text-slate-600">No. Surat Referensi</div>
                <div className="col-span-9 font-mono text-slate-800">: {loan.reference_letter_no || '-'}</div>

                <div className="col-span-3 font-semibold text-slate-600">Tipe Peminjaman</div>
                <div className="col-span-9 font-bold uppercase text-slate-800">: {loan.loan_type}</div>

                <div className="col-span-3 font-semibold text-slate-600">Batas Pengembalian</div>
                <div className="col-span-9 font-bold text-rose-700">
                  : {loan.expected_return_date ? new Date(loan.expected_return_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </div>
              </div>
            </div>

            {/* Tabel Daftar Dokumen */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-800 mb-2">
                Rincian Berkas Dokumen yang Diserahterimakan ({loan.items?.length || 0} Item):
              </p>
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold">
                    <th className="border border-slate-300 py-1.5 px-2 text-center w-8">No</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-left">Kode Tracking</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-left">Nama Vendor & No. Invoice</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-left">Boks Asal Gudang</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loan.items?.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border border-slate-300 py-1.5 px-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 py-1.5 px-2 font-mono font-semibold">
                        {item.invoice?.tracking_code}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2">
                        <div>{item.invoice?.vendor_name}</div>
                        <small className="text-slate-500 font-mono">{item.invoice?.invoice_number || '-'}</small>
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 font-mono text-[11px]">
                        {item.original_box?.box_number || item.invoice?.box?.box_number || '-'}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 uppercase font-semibold text-[10px]">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Syarat & Ketentuan */}
            <div className="text-[11px] text-slate-600 space-y-1 mb-8 leading-relaxed">
              <p className="font-bold text-slate-800">Ketentuan Peminjaman Dokumen Arsip:</p>
              <p>1. Peminjam bertanggung jawab penuh atas keamanan, keutuhan, dan kerahasiaan dokumen fisik/digital.</p>
              <p>2. Dilarang menggandakan atau menyebarluaskan dokumen tanpa izin tertulis dari manajemen Finance.</p>
              <p>3. Dokumen wajib dikembalikan tepat waktu sesuai batas tanggal pengembalian yang tercantum di atas.</p>
            </div>

            {/* Kolom Tanda Tangan */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs mt-8">
              <div>
                <p className="font-semibold text-slate-700">Pihak Penyerah / Staf Arsip Finance</p>
                <div className="h-20 flex items-center justify-center text-slate-300 italic">
                  ( Tanda Tangan & Cap )
                </div>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-40">
                  {loan.approver?.name || loan.creator?.name || 'Petugas Arsip'}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-700">Pihak Penerima / Peminjam Luar</p>
                <div className="h-20 flex items-center justify-center text-slate-300 italic">
                  ( Tanda Tangan & Cap )
                </div>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-40">
                  {loan.borrower_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
