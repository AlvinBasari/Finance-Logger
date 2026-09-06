import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { Modal } from './Modal';
import { Button } from './Button';
import { Printer } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

import { INVOICE_CHECKLIST_SECTIONS } from '../../constants/invoiceChecklist';

export const PrintModal = ({ isOpen, onClose, type = 'receipt', data = {} }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (isOpen && barcodeRef.current && (data?.tracking_code || data?.box_number)) {
      try {
        JsBarcode(barcodeRef.current, data.tracking_code || data.box_number, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 12,
          font: 'JetBrains Mono',
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [isOpen, data]);

  const handlePrint = () => {
    if (window.electronAPI?.print) {
      window.electronAPI.print({ silent: false });
    } else {
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        type === 'receipt'
          ? 'Cetak Tanda Terima Dokumen'
          : type === 'box_label'
          ? 'Cetak Label Boks Arsip'
          : type === 'checklist'
          ? 'Cetak Check List Kelengkapan Invoice'
          : 'Cetak Surat Jalan Pengiriman'
      }
      subtitle="Pratinjau cetak resmi sistem invoice & pengarsipan"
      maxWidth={type === 'surat_jalan' || type === 'checklist' ? 'max-w-3xl' : 'max-w-md'}
    >
      <div className="flex flex-col gap-6">
        {/* Printable Canvas Section */}
        <div
          id="printable-area"
          className="bg-white border border-slate-300 rounded-lg p-6 text-slate-900 shadow-xs font-sans select-text"
        >
          {type === 'receipt' && (
            <div className="flex flex-col gap-4">
              <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold tracking-tight uppercase">Tanda Terima Berkas Invoice</h2>
                  <p className="text-xs text-slate-500 font-medium">Divisi Finance & Accounting</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-slate-500 block">
                    {formatDateTime(data?.created_at || new Date())}
                  </span>
                </div>
              </div>

              <div className="flex justify-center my-2">
                <svg ref={barcodeRef} />
              </div>

              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500 font-medium w-36">Kode Tracking:</td>
                    <td className="py-1.5 font-mono font-bold">{data?.tracking_code}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500 font-medium">Nama Vendor:</td>
                    <td className="py-1.5 font-semibold">{data?.vendor_name}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500 font-medium">Pengirim / Divisi:</td>
                    <td className="py-1.5">{data?.sender_division || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500 font-medium">Jumlah Lembar:</td>
                    <td className="py-1.5 font-semibold">{data?.document_count} Lembar</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500 font-medium">Diterima Oleh:</td>
                    <td className="py-1.5">{data?.creator?.name || 'Staff Finance'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center">
                * Simpan tanda terima ini sebagai bukti serah terima dokumen fisik invoice.
              </div>
            </div>
          )}

          {type === 'box_label' && (
            <div className="flex flex-col gap-4 border-2 border-slate-900 p-4 rounded">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">LABEL BOKS ARSIP</h2>
                  <p className="text-xs text-slate-600">Gudang Arsip Finance</p>
                </div>
                <div className="p-1 bg-white border border-slate-200 rounded">
                  <QRCodeSVG value={data?.box_number || 'BOX'} size={72} level="H" />
                </div>
              </div>

              <div className="bg-slate-100 p-3 rounded text-center my-1">
                <span className="text-xs text-slate-500 font-semibold block uppercase">Nomor Boks</span>
                <span className="text-xl font-mono font-bold tracking-wider">{data?.box_number}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Lokasi Rak:</span>
                  <span className="font-semibold text-slate-900">{data?.rack_location || 'Menunggu Penempatan'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Total Dokumen:</span>
                  <span className="font-semibold text-slate-900">{data?.invoices_count || data?.invoices?.length || 0} Berkas</span>
                </div>
                <div className="col-span-2 mt-1">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Keterangan:</span>
                  <span className="text-slate-700 text-[11px]">{data?.description || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {type === 'surat_jalan' && (
            <div className="flex flex-col gap-4">
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-tight">Surat Jalan Pengiriman Arsip</h2>
                  <p className="text-xs text-slate-600">Nomor Boks: <span className="font-mono font-bold">{data?.box_number}</span></p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Tanggal: {formatDate(new Date())}</p>
                  <p className="font-mono">FIN-SJ-{data?.box_number?.replace(/[^0-9]/g, '')}</p>
                </div>
              </div>

              <div className="text-xs">
                <p className="text-slate-600 mb-3">
                  Berikut adalah daftar berkas invoice fisik yang dikirimkan ke gudang arsip:
                </p>

                <table className="w-full border border-slate-300 text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2 text-left w-10">No</th>
                      <th className="p-2 text-left">Kode Tracking</th>
                      <th className="p-2 text-left">Nomor Invoice</th>
                      <th className="p-2 text-left">Nama Vendor</th>
                      <th className="p-2 text-right">Nominal (Total)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.invoices?.map((inv, idx) => (
                      <tr key={inv.id} className="border-b border-slate-200">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2 font-mono font-semibold">{inv.tracking_code}</td>
                        <td className="p-2 font-mono">{inv.invoice_number || '-'}</td>
                        <td className="p-2">{inv.vendor_name}</td>
                        <td className="p-2 text-right font-mono tabular-nums">{formatCurrency(inv.total_amount, inv.currency)}</td>
                      </tr>
                    ))}
                    {(!data?.invoices || data.invoices.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">Tidak ada data invoice di boks ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center text-xs mt-8 pt-4">
                <div>
                  <p className="text-slate-500 mb-12">Diserahkan Oleh (Finance)</p>
                  <p className="font-semibold border-t border-slate-400 pt-1">({data?.creator?.name || 'Staff Finance'})</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-12">Ekspedisi / Kurir Internal</p>
                  <p className="font-semibold border-t border-slate-400 pt-1">(...........................................)</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-12">Diterima Gudang (Warehouse)</p>
                  <p className="font-semibold border-t border-slate-400 pt-1">(...........................................)</p>
                </div>
              </div>
            </div>
          )}

          {type === 'checklist' && (
            <div className="flex flex-col gap-4 text-slate-900 font-sans">
              {/* Header Star Energy Geothermal Standard */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                    CHECK LIST INVOICE
                  </h1>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    No. Tracking: <span className="font-mono font-bold text-slate-900">{data?.tracking_code}</span> | Vendor: <span className="font-bold">{data?.vendor_name}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    No. Invoice: {data?.invoice_number || '-'} &bull; Tanggal: {formatDate(data?.received_date || new Date())}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">★</span>
                    <span className="text-xs font-bold uppercase text-slate-800 tracking-tight">star energy</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">geothermal</span>
                </div>
              </div>

              {/* Checklist Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                      <th className="border border-slate-400 py-1.5 px-2 text-center w-8">NO</th>
                      <th className="border border-slate-400 py-1.5 px-2 text-left">DOKUMEN / KELENGKAPAN BERKAS</th>
                      <th className="border border-slate-400 py-1.5 px-2 text-center w-16">CHECK LIST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INVOICE_CHECKLIST_SECTIONS.map((sec) => (
                      <React.Fragment key={sec.number}>
                        {/* Section Header Row */}
                        <tr className="bg-slate-50/60 font-bold border-t border-b border-slate-300">
                          <td className="border border-slate-400 py-1 px-2 text-center align-top font-bold">
                            {sec.number}
                          </td>
                          <td className="border border-slate-400 py-1 px-2 uppercase text-[11px]" colSpan={sec.items.length === 1 ? 1 : 2}>
                            {sec.title}
                          </td>
                          {sec.items.length === 1 && (
                            <td className="border border-slate-400 py-1 px-2 text-center align-middle">
                              <div className="w-5 h-5 border border-slate-400 mx-auto flex items-center justify-center font-bold text-xs">
                                {data?.verification_checklist?.[sec.items[0].key] ? '✔' : ''}
                              </div>
                            </td>
                          )}
                        </tr>

                        {/* Sub-items Rows (if multiple items) */}
                        {sec.items.length > 1 &&
                          sec.items.map((item) => (
                            <tr key={item.key} className="border-b border-slate-200">
                              <td className="border-r border-slate-400"></td>
                              <td className="border border-slate-400 py-1 px-3 pl-6 text-[11px] text-slate-700">
                                {item.label}
                                {item.isOptional && <span className="text-slate-400 ml-1 italic">(** Jika ada)</span>}
                              </td>
                              <td className="border border-slate-400 py-1 px-2 text-center align-middle">
                                <div className="w-5 h-5 border border-slate-400 mx-auto flex items-center justify-center font-bold text-xs">
                                  {data?.verification_checklist?.[item.key] ? '✔' : ''}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Catatan Kaki Dokumen */}
              <div className="text-[10px] text-slate-600 space-y-0.5 border-t border-slate-200 pt-2 leading-relaxed">
                <p className="font-bold text-slate-800">Catatan :</p>
                <p>Dokumen di atas WAJIB dilampirkan pada tagihan atau invoice dan DIURUTKAN sesuai dengan nomor yang dipersyaratkan baik invoice softcopy atau hardcopy.</p>
                <p>Setiap dokumen hanya kirimkan masing-masing 1 copy (tanpa rangkap).</p>
                <p>Point 4 & 5 khusus untuk Purchase Order</p>
                <p>Point 3 & 6 khusus untuk Service Order</p>
                <p>** Jika ada</p>
              </div>

              {/* Tanda Tangan Pemeriksa */}
              <div className="flex justify-between items-end text-xs pt-4 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] block">Status Pemeriksaan:</span>
                  <span className="font-bold uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-300 inline-block text-[10px] mt-0.5">
                    {data?.verification_status === 'complete' ? 'LENGKAP (COMPLETE)' : data?.verification_status || 'PENDING'}
                  </span>
                </div>
                <div className="text-center min-w-36">
                  <p className="text-slate-500 text-[11px]">Pemeriksa / Verifikator,</p>
                  <div className="h-10"></div>
                  <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                    {data?.verifier?.name || data?.creator?.name || 'Staff Finance'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" icon={Printer} onClick={handlePrint}>
            Cetak Sekarang
          </Button>
        </div>
      </div>
    </Modal>
  );
};
