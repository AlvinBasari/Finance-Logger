import React, { useState, useEffect } from 'react';
import { loanApi } from '../../services/api';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Barcode,
  Archive,
  Calendar,
  Building2,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { showToast } from '../ui/Toast';

export const ReturnLoanModal = ({ isOpen, loan, onClose, onSuccess }) => {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemsState, setItemsState] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loan && loan.items) {
      setItemsState(
        loan.items.map((item) => ({
          item_id: item.id,
          invoice_id: item.invoice_id,
          tracking_code: item.invoice?.tracking_code,
          vendor_name: item.invoice?.vendor_name,
          invoice_number: item.invoice?.invoice_number,
          box_number: item.original_box?.box_number || item.invoice?.box?.box_number || null,
          rack_location: item.original_box?.rack_location || item.invoice?.box?.rack_location || null,
          already_returned: item.status !== 'borrowed',
          status: item.status === 'borrowed' ? 'returned' : item.status,
          condition_notes: item.return_condition_notes || '',
          is_selected: item.status === 'borrowed', // default check unreturned items
        }))
      );
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const handleToggleItem = (itemId) => {
    setItemsState((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, is_selected: !item.is_selected } : item
      )
    );
  };

  const handleStatusChange = (itemId, newStatus) => {
    setItemsState((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleNotesChange = (itemId, notes) => {
    setItemsState((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, condition_notes: notes } : item
      )
    );
  };

  const handleSelectAll = (select) => {
    setItemsState((prev) =>
      prev.map((item) =>
        item.already_returned ? item : { ...item, is_selected: select }
      )
    );
  };

  const handleBarcodeScan = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const trimmed = barcodeInput.trim().toLowerCase();
    const matched = itemsState.find(
      (item) =>
        item.tracking_code?.toLowerCase() === trimmed ||
        item.invoice_number?.toLowerCase() === trimmed
    );

    if (matched) {
      if (matched.already_returned) {
        showToast(`Dokumen ${matched.tracking_code} sudah pernah dikembalikan sebelumnya.`, 'info');
      } else {
        setItemsState((prev) =>
          prev.map((item) =>
            item.item_id === matched.item_id
              ? { ...item, is_selected: true, status: 'returned' }
              : item
          )
        );
        showToast(`Dokumen ${matched.tracking_code} ditandai untuk pengembalian!`, 'success');
      }
      setBarcodeInput('');
    } else {
      showToast(`Dokumen "${barcodeInput}" tidak terdaftar dalam peminjaman ini.`, 'warning');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedToReturn = itemsState.filter(
      (item) => !item.already_returned && item.is_selected
    );

    if (selectedToReturn.length === 0) {
      showToast('Pilih minimal 1 dokumen yang dikembalikan', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        actual_return_date: returnDate,
        return_all: selectedToReturn.length === itemsState.filter((i) => !i.already_returned).length,
        items: selectedToReturn.map((item) => ({
          item_id: item.item_id,
          status: item.status,
          condition_notes: item.condition_notes || 'Lengkap & baik',
        })),
      };

      const res = await loanApi.returnItems(loan.id, payload);
      showToast(res.data?.message || 'Pengembalian dokumen berhasil dicatat!', 'success');
      onSuccess?.(res.data?.data);
      onClose();
    } catch (err) {
      console.error('Return error:', err);
      showToast(err.response?.data?.message || 'Gagal memproses pengembalian.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unreturnedCount = itemsState.filter((i) => !i.already_returned).length;
  const selectedCount = itemsState.filter((i) => !i.already_returned && i.is_selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Verifikasi Pengembalian Dokumen Arsip</h2>
              <p className="text-xs text-emerald-200">
                No. Pinjam: <span className="font-mono font-bold text-white">{loan.loan_code}</span> | {loan.organization} ({loan.borrower_name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary Box & Return Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Peminjam / Lembaga:</span>
              <span className="text-xs font-bold text-slate-900 block">{loan.borrower_name}</span>
              <span className="text-xs text-slate-600 block">{loan.organization}</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Jatuh Tempo Pengembalian:</span>
              <span className={`text-xs font-bold block ${loan.is_overdue ? 'text-rose-600' : 'text-slate-800'}`}>
                {loan.expected_return_date ? new Date(loan.expected_return_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
              </span>
              {loan.is_overdue && (
                <span className="text-[10px] text-rose-500 font-bold">Terlambat {Math.abs(loan.days_remaining)} Hari</span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tanggal Diterima Kembali <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Barcode Quick Check-in */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600" />
              <input
                type="text"
                placeholder="Scan barcode / tracking code berkas yang kembali..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeScan(e);
                  }
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20"
              />
            </div>
            <button
              type="button"
              onClick={handleBarcodeScan}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Barcode className="w-4 h-4" />
              Scan Check-in
            </button>
          </div>

          {/* Table of Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Berkas Dokumen ({selectedCount} / {unreturnedCount} Dipilih)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-emerald-700 hover:underline font-semibold text-[11px]"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-slate-500 hover:underline text-[11px]"
                >
                  Batal Pilih
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">Pilih</th>
                    <th className="py-2.5 px-3">Kode Tracking & Vendor</th>
                    <th className="py-2.5 px-3">Lokasi Restorasi Boks Gudang</th>
                    <th className="py-2.5 px-3 w-32">Kondisi Fisik</th>
                    <th className="py-2.5 px-3">Catatan Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {itemsState.map((item) => (
                    <tr
                      key={item.item_id}
                      className={`transition ${
                        item.already_returned
                          ? 'bg-slate-50 opacity-60'
                          : item.is_selected
                          ? 'bg-emerald-50/40'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          disabled={item.already_returned}
                          checked={item.is_selected || item.already_returned}
                          onChange={() => handleToggleItem(item.item_id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-900">{item.tracking_code}</div>
                        <div className="text-slate-600 text-[11px]">
                          {item.vendor_name} {item.invoice_number ? `(${item.invoice_number})` : ''}
                        </div>
                        {item.already_returned && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold text-[9px] uppercase">
                            Sudah Dikembalikan
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {item.box_number ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[11px]">
                            <Archive className="w-3.5 h-3.5 text-amber-700" />
                            <span>
                              Kembalikan ke: <strong>{item.box_number}</strong>
                              {item.rack_location ? ` (Rak ${item.rack_location})` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum memiliki boks</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <select
                          disabled={item.already_returned || !item.is_selected}
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.item_id, e.target.value)}
                          className="w-full text-xs py-1 px-2 border border-slate-300 rounded focus:ring-emerald-500 bg-white"
                        >
                          <option value="returned">Lengkap & Baik</option>
                          <option value="damaged">Cacat / Rusak</option>
                          <option value="lost">Hilang</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          disabled={item.already_returned || !item.is_selected}
                          placeholder="Catatan kondisi fisik..."
                          value={item.condition_notes}
                          onChange={(e) => handleNotesChange(item.item_id, e.target.value)}
                          className="w-full text-xs py-1 px-2 border border-slate-300 rounded focus:ring-emerald-500 bg-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedCount} dari {unreturnedCount} berkas akan diproses kembali ke gudang arsip.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={isSubmitting || selectedCount === 0}
              onClick={handleSubmit}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
            >
              {isSubmitting ? 'Menyimpan...' : 'Selesaikan Pengembalian'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
