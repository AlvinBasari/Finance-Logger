import React, { useState } from 'react';
import { applyWatermarkToPdf } from '../../utils/pdfWatermarkService';
import { X, Download, ShieldAlert, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { showToast } from '../ui/Toast';

export const WatermarkDownloadModal = ({ isOpen, invoice, loan, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customOrg, setCustomOrg] = useState(loan?.organization || '');
  const [customPurpose, setCustomPurpose] = useState(loan?.purpose || 'Audit / Pemeriksaan Eksternal');
  const [opacity, setOpacity] = useState(0.22);

  if (!isOpen || !invoice) return null;

  const pdfUrl = invoice.latest_file_url || invoice.soft_file_url;

  const handleDownload = async () => {
    if (!pdfUrl) {
      showToast('Dokumen ini belum memiliki berkas scan PDF atau soft file.', 'warning');
      return;
    }

    try {
      setIsProcessing(true);
      const options = {
        organization: customOrg || loan?.organization || 'AUDITOR EKSTERNAL',
        borrowerName: loan?.borrower_name || '',
        loanCode: loan?.loan_code || 'LN-SALINAN',
        purpose: customPurpose,
        opacity: Number(opacity),
      };

      const result = await applyWatermarkToPdf(pdfUrl, options);
      const fileName = `${invoice.tracking_code}_WATERMARKED_${(customOrg || 'PIHAK_LUAR').replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;
      result.download(fileName);
      showToast('PDF ber-watermark berhasil diunduh!', 'success');
      onClose();
    } catch (err) {
      console.error('Watermarking error:', err);
      showToast('Gagal memproses watermark PDF. Pastikan file PDF dapat diakses.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-tight">Unduh Salinan PDF Ber-Watermark</h2>
              <p className="text-[11px] text-slate-300">Proteksi kerahasiaan dokumen untuk pihak luar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Invoice Summary */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Kode Tracking:</span>
              <span className="font-mono font-bold text-slate-900">{invoice.tracking_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vendor:</span>
              <span className="font-medium text-slate-800">{invoice.vendor_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">No. Invoice:</span>
              <span className="font-mono text-slate-800">{invoice.invoice_number || '-'}</span>
            </div>
          </div>

          {/* Watermark Config Fields */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Instansi / Pihak Penerima Watermark <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: KAP PwC / KPP Pratama"
              value={customOrg}
              onChange={(e) => setCustomOrg(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Keperluan / Tujuan
            </label>
            <input
              type="text"
              placeholder="Contoh: Audit Tahunan 2025"
              value={customPurpose}
              onChange={(e) => setCustomPurpose(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Tingkat Transparansi (Opacity)</label>
              <span className="font-mono text-slate-500">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.45"
              step="0.02"
              value={opacity}
              onChange={(e) => setOpacity(e.target.value)}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-900 text-[11px] leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              Watermark diagonal merah semi-transparan dan header kerahasiaan akan dibubuhkan otomatis di setiap halaman PDF untuk mencegah penyalahgunaan dokumen.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded font-semibold transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isProcessing || !pdfUrl}
            onClick={handleDownload}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            {isProcessing ? 'Menerapkan Watermark...' : 'Download Watermarked PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
