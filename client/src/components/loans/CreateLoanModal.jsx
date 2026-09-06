import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoiceApi, loanApi } from '../../services/api';
import {
  X,
  Plus,
  Trash2,
  Search,
  Barcode,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  FileCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { showToast } from '../ui/Toast';

export const CreateLoanModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    borrower_name: '',
    organization: '',
    contact_phone: '',
    contact_email: '',
    purpose: '',
    reference_letter_no: '',
    loan_date: new Date().toISOString().split('T')[0],
    expected_return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 hari
    loan_type: 'physical',
    notes: '',
  });

  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch invoices for selection
  const { data: invoiceData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices-for-loan', invoiceSearch],
    queryFn: () => invoiceApi.getAll({ search: invoiceSearch, per_page: 20 }),
    enabled: isOpen,
  });

  const invoices = invoiceData?.data?.data || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectInvoice = (inv) => {
    if (selectedInvoices.some((item) => item.id === inv.id)) {
      showToast('Dokumen ini sudah ada di daftar pinjam', 'info');
      return;
    }
    if (inv.is_loaned) {
      showToast(`Dokumen ${inv.tracking_code} sedang dipinjam oleh ${inv.active_loan_summary?.organization || 'pihak lain'}`, 'warning');
      return;
    }
    setSelectedInvoices((prev) => [...prev, inv]);
  };

  const handleRemoveInvoice = (invId) => {
    setSelectedInvoices((prev) => prev.filter((item) => item.id !== invId));
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const trimmed = barcodeInput.trim();
    // Cari invoice berdasarkan tracking code atau invoice number
    const matched = invoices.find(
      (inv) =>
        inv.tracking_code.toLowerCase() === trimmed.toLowerCase() ||
        (inv.invoice_number && inv.invoice_number.toLowerCase() === trimmed.toLowerCase())
    );

    if (matched) {
      handleSelectInvoice(matched);
      setBarcodeInput('');
    } else {
      // Coba fetch manual jika tidak ada di 20 hasil pertama
      invoiceApi
        .getAll({ search: trimmed, per_page: 5 })
        .then((res) => {
          const found = res.data?.data?.[0];
          if (found) {
            handleSelectInvoice(found);
            setBarcodeInput('');
          } else {
            showToast(`Invoice dengan barcode/nomor "${trimmed}" tidak ditemukan.`, 'error');
          }
        })
        .catch(() => {
          showToast('Gagal mencari dokumen via barcode.', 'error');
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.borrower_name.trim()) {
      showToast('Nama PIC / Peminjam wajib diisi', 'error');
      return;
    }
    if (!formData.organization.trim()) {
      showToast('Nama Instansi / Lembaga wajib diisi', 'error');
      return;
    }
    if (!formData.purpose.trim()) {
      showToast('Keperluan / Tujuan peminjaman wajib diisi', 'error');
      return;
    }
    if (selectedInvoices.length === 0) {
      showToast('Pilih minimal 1 dokumen invoice yang akan dipinjam', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        invoice_ids: selectedInvoices.map((inv) => inv.id),
      };

      const res = await loanApi.create(payload);
      showToast(res.data?.message || 'Peminjaman berhasil didaftarkan!', 'success');
      onSuccess?.(res.data?.data);
      onClose();
    } catch (err) {
      console.error('Create loan error:', err);
      showToast(err.response?.data?.message || 'Gagal membuat data peminjaman.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-corporate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Form Peminjaman Dokumen Arsip</h2>
              <p className="text-xs text-slate-300">Pencatatan peminjaman fisik atau digital oleh pihak luar (KAP, Pajak, Vendor, Legal)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Tipe Peminjaman */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tipe Peminjaman Berkas
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition ${
                  formData.loan_type === 'physical'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-2xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <input
                  type="radio"
                  name="loan_type"
                  value="physical"
                  checked={formData.loan_type === 'physical'}
                  onChange={handleInputChange}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold block flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Peminjaman Fisik (Hardcopy Asli)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                    Dokumen fisik dikeluarkan dari boks gudang arsip. Memerlukan BAST serah terima & verifikasi pengembalian.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition ${
                  formData.loan_type === 'digital'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-2xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <input
                  type="radio"
                  name="loan_type"
                  value="digital"
                  checked={formData.loan_type === 'digital'}
                  onChange={handleInputChange}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold block flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Peminjaman Digital (Softcopy Ber-Watermark)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                    Dokumen fisik tetap di gudang. Pihak luar diberikan salinan PDF ber-watermark khusus dengan proteksi kerahasiaan.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Informasi Peminjam & Lembaga */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-corporate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-corporate-700" />
              Identitas Peminjam (Pihak Luar)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Instansi / Kantor Luar <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    name="organization"
                    placeholder="Contoh: KAP PwC / KPP Pratama / PT Vendor"
                    value={formData.organization}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama PIC / Petugas Peminjam <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    name="borrower_name"
                    placeholder="Contoh: Bpk. Hendra Gunawan"
                    value={formData.borrower_name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Telepon / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    name="contact_phone"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Kontak PIC <span className="text-slate-400 text-[10px] font-normal">(Untuk BAST & Notifikasi Pengingat)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    name="contact_email"
                    placeholder="pic.auditor@company.com"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keperluan / Tujuan Peminjaman <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    name="purpose"
                    placeholder="Contoh: Audit Laporan Keuangan 2025"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Surat Tugas / Referensi Resmi
                </label>
                <input
                  type="text"
                  name="reference_letter_no"
                  placeholder="Contoh: ST-AUDIT/KAP/2026/089"
                  value={formData.reference_letter_no}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Peminjaman / Serah Terima <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    name="loan_date"
                    value={formData.loan_date}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Waktu Pengembalian (Due Date) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-rose-500" />
                  <input
                    type="date"
                    name="expected_return_date"
                    value={formData.expected_return_date}
                    onChange={handleInputChange}
                    min={formData.loan_date}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white font-medium text-rose-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Pemilihan Dokumen Invoice */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-corporate-900 uppercase tracking-wider">
                Pilih Dokumen Invoice ({selectedInvoices.length} Terpilih) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Gunakan scan barcode atau cari invoice di bawah ini
              </span>
            </div>

            {/* Barcode & Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Scan Barcode input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-indigo-600" />
                  <input
                    type="text"
                    placeholder="Scan barcode / tracking code..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeSubmit(e);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleBarcodeSubmit}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </button>
              </div>

              {/* Text Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari vendor / no invoice / nomor boks..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Quick Picker Results List */}
            {invoiceSearch && (
              <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto bg-slate-50 divide-y divide-slate-100 p-1">
                {isLoadingInvoices ? (
                  <p className="p-3 text-xs text-slate-400 text-center">Mencari dokumen...</p>
                ) : invoices.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 text-center">Tidak ada invoice ditemukan.</p>
                ) : (
                  invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2 flex items-center justify-between hover:bg-white rounded transition text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{inv.tracking_code}</span>
                        <span className="text-slate-500 ml-2">| {inv.vendor_name} ({inv.invoice_number || 'No Inv -'})</span>
                        {inv.box && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px]">
                            Boks: {inv.box.box_number} (Rak: {inv.box.rack_location || '-'})
                          </span>
                        )}
                        {inv.is_loaned && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                            Sedang Dipinjam
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={inv.is_loaned || selectedInvoices.some((item) => item.id === inv.id)}
                        onClick={() => handleSelectInvoice(inv)}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-indigo-600 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-200 disabled:hover:text-slate-600 text-slate-700 rounded text-[11px] font-medium transition"
                      >
                        {selectedInvoices.some((item) => item.id === inv.id) ? 'Terpilih' : '+ Pilih'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Selected Invoices Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Kode Tracking</th>
                    <th className="py-2.5 px-3">Vendor & No. Invoice</th>
                    <th className="py-2.5 px-3">Lokasi Fisik di Gudang</th>
                    <th className="py-2.5 px-3">Nominal</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {selectedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        Belum ada dokumen yang dipilih. Cari dan tambahkan invoice di atas.
                      </td>
                    </tr>
                  ) : (
                    selectedInvoices.map((inv, idx) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-indigo-900">{inv.tracking_code}</td>
                        <td className="py-2 px-3">
                          <div className="font-medium text-slate-800">{inv.vendor_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{inv.invoice_number || '-'}</div>
                        </td>
                        <td className="py-2 px-3">
                          {inv.box ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px]">
                              Boks: {inv.box.box_number} {inv.box.rack_location ? `(Rak ${inv.box.rack_location})` : ''}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Belum masuk boks</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-700">
                          {inv.currency || 'IDR'} {Number(inv.total_amount || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveInvoice(inv.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Hapus dari daftar pinjam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Keterangan Tambahan
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Catatan khusus terkait pengamanan atau kondisi berkas..."
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total Dokumen Dipinjam: <strong className="text-slate-800">{selectedInvoices.length}</strong> Berkas
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting || selectedInvoices.length === 0}
              onClick={handleSubmit}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
            >
              {isSubmitting ? 'Memproses...' : 'Simpan & Buat Peminjaman'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
