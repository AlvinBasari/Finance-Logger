import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PdfViewer } from '../components/ui/PdfViewer';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import {
  SplitSquareVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';

export const Stage5Reconciliation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('id');
  const { addToast } = useAppStore();

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reconciliation Audit State
  const [auditChecklist, setAuditChecklist] = useState({
    amount_matches: false,
    tax_verified: false,
    stamp_signature_valid: false,
  });
  const [reconciliationNotes, setReconciliationNotes] = useState('');

  const loadPendingInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await invoiceApi.getAll({ status: 'scanned', per_page: 25 });
      const list = res.data?.data?.data || [];
      setInvoices(list);

      if (invoiceIdParam) {
        const found = list.find((i) => i.id === parseInt(invoiceIdParam));
        if (found) {
          selectInvoice(found);
        } else {
          const single = await invoiceApi.getById(invoiceIdParam);
          if (single.data?.data) {
            selectInvoice(single.data.data);
          }
        }
      } else if (list.length > 0) {
        selectInvoice(list[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectInvoice = (inv) => {
    setSelectedInvoice(inv);
    setAuditChecklist({
      amount_matches: true,
      tax_verified: true,
      stamp_signature_valid: true,
    });
    setReconciliationNotes(inv.reconciliation_notes || '');
  };

  useEffect(() => {
    loadPendingInvoices();
  }, [invoiceIdParam]);

  const toggleCheck = (key) => {
    setAuditChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [confirmDecision, setConfirmDecision] = useState(null); // 'approve' | 'need_correction' | null

  const handlePreDecision = (decision) => {
    if (!selectedInvoice) return;

    if (decision === 'approve' && (!auditChecklist.amount_matches || !auditChecklist.tax_verified)) {
      addToast('Harap centang checklist verifikasi nominal dan faktur pajak sebelum menyetujui', 'warning');
      return;
    }

    setConfirmDecision(decision);
  };

  const handleDecision = async () => {
    if (!selectedInvoice || !confirmDecision) return;

    const decision = confirmDecision;
    setConfirmDecision(null);
    setIsProcessing(true);
    try {
      const res = await invoiceApi.reconcile(selectedInvoice.id, {
        decision,
        notes: reconciliationNotes,
      });

      if (decision === 'approve') {
        addToast(`Invoice ${selectedInvoice.tracking_code} disetujui & siap dikemas ke boks arsip`, 'success');
        navigate('/stage-6');
      } else {
        addToast(`Invoice dikembalikan ke tahap input data untuk koreksi`, 'warning');
        navigate(`/stage-3?id=${selectedInvoice.id}`);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memproses rekonsiliasi', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get file URL from latest attachment
  const activeAttachment = selectedInvoice?.attachments?.[0];
  const fileUrl = activeAttachment?.url || null;

  return (
    <div className="max-w-7xl mx-auto space-y-4 h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">TAHAP 5</span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Rekonsiliasi Kesesuaian (Split-Screen)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Komparasi satu layar antara hasil pindaian digital multi-halaman dengan data transaksi sistem.
          </p>
        </div>

        {/* Invoice Selector Dropdown if multiple */}
        {invoices.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Pilih Dokumen:</span>
            <select
              value={selectedInvoice?.id || ''}
              onChange={(e) => {
                const found = invoices.find((i) => i.id === parseInt(e.target.value));
                if (found) selectInvoice(found);
              }}
              className="h-8 px-2 border border-slate-300 rounded bg-white text-slate-900 font-mono text-xs"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.tracking_code} - {inv.vendor_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedInvoice ? (
        /* Split Screen Dual Pane Grid (50% / 50%) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Left Pane: PDF / Scanned Document Viewer (50%) */}
          <div className="h-full flex flex-col">
            <PdfViewer
              fileUrl={fileUrl}
              fileName={activeAttachment?.file_name || `${selectedInvoice.tracking_code}_scan.pdf`}
            />
          </div>

          {/* Right Pane: Read-only Summary & Audit Reconciliation Form (50%) */}
          <div className="h-full bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
            {/* Header Box */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 block">KODE TRACKING</span>
                <span className="text-sm font-mono font-extrabold text-slate-900">{selectedInvoice.tracking_code}</span>
              </div>
              <Badge status={selectedInvoice.status} />
            </div>

            {/* Audit Content Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
              {/* 1. Transaction Summary Matrix */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Nama Vendor</span>
                  <span className="font-semibold text-slate-900 text-xs">{selectedInvoice.vendor_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Nomor Invoice</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{selectedInvoice.invoice_number || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Tanggal Invoice</span>
                  <span className="text-slate-800">{formatDate(selectedInvoice.invoice_date)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Jatuh Tempo</span>
                  <span className="text-slate-800">{formatDate(selectedInvoice.due_date)}</span>
                </div>
              </div>

              {/* 2. Financial Amount Breakdown */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Rincian Nilai Finansial (Sistem):
                </h4>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden font-mono text-xs">
                  <div className="flex justify-between p-2.5 bg-white">
                    <span className="text-slate-500">Dasar Pengenaan Pajak (DPP):</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white">
                    <span className="text-slate-500">PPN:</span>
                    <span className="font-semibold tabular-nums text-slate-800">
                      {formatCurrency(selectedInvoice.tax_ppn, selectedInvoice.currency)}
                    </span>
                  </div>
                  {parseFloat(selectedInvoice.tax_pph) > 0 && (
                    <div className="flex justify-between p-2.5 bg-white">
                      <span className="text-slate-500">Potongan PPh:</span>
                      <span className="font-semibold tabular-nums text-rose-600">
                        - {formatCurrency(selectedInvoice.tax_pph, selectedInvoice.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between p-3 bg-slate-900 text-white font-bold text-sm">
                    <span>TOTAL TAGIHAN:</span>
                    <span className="text-emerald-400 tabular-nums">
                      {formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Reconciliation Checklist */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Checklist Kesesuaian Fisik & Digital:
                </h4>
                <div className="space-y-2">
                  {[
                    { key: 'amount_matches', label: 'Nominal DPP, PPN, dan Total sama persis dengan berkas scan' },
                    { key: 'tax_verified', label: 'Nomor Faktur Pajak terlampir dan terverifikasi sah' },
                    { key: 'stamp_signature_valid', label: 'Tanda tangan dan stempel basah rekanan telah terverifikasi' },
                  ].map((chk) => (
                    <div
                      key={chk.key}
                      onClick={() => toggleCheck(chk.key)}
                      className={`p-2.5 rounded-md border transition cursor-pointer flex items-center gap-2.5 ${
                        auditChecklist[chk.key]
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {auditChecklist[chk.key] ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs">{chk.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Notes */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 tracking-wider uppercase block mb-1">
                  Catatan Supervisor / Rekonsiliasi:
                </label>
                <textarea
                  rows={2}
                  value={reconciliationNotes}
                  onChange={(e) => setReconciliationNotes(e.target.value)}
                  placeholder="Keterangan hasil rekonsiliasi..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
              <Button
                variant="danger"
                size="sm"
                icon={RotateCcw}
                onClick={() => handlePreDecision('need_correction')}
                isLoading={isProcessing}
              >
                Butuh Revisi / Koreksi
              </Button>

              <Button
                variant="success"
                size="md"
                icon={CheckCircle2}
                onClick={() => handlePreDecision('approve')}
                isLoading={isProcessing}
              >
                Approve & Mark as Reconciled
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <div className="py-24 text-center text-slate-400 text-xs">
            <SplitSquareVertical className="w-12 h-12 mx-auto stroke-[1.5] mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700">Tidak Ada Antrean Rekonsiliasi</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Dokumen yang telah dipindai di Tahap 4 akan otomatis muncul di layar ini.
            </p>
          </div>
        </Card>
      )}

      {/* Confirmation Dialog for Decision */}
      <ConfirmModal
        isOpen={!!confirmDecision}
        onClose={() => setConfirmDecision(null)}
        onConfirm={handleDecision}
        title={confirmDecision === 'approve' ? 'Konfirmasi Persetujuan Rekonsiliasi' : 'Konfirmasi Permintaan Koreksi'}
        message={
          confirmDecision === 'approve' ? (
            <div>
              <p className="mb-2">
                Apakah Anda yakin berkas scan dan data invoice <b>{selectedInvoice?.tracking_code}</b> ({selectedInvoice?.vendor_name}) sudah <b>100% cocok</b> dan disetujui?
              </p>
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] font-mono">
                Total Tagihan: {formatCurrency(selectedInvoice?.total_amount, selectedInvoice?.currency)}
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-2">
                Kembalikan invoice <b>{selectedInvoice?.tracking_code}</b> ke <b>Tahap 3 (Input Data)</b> untuk perbaikan oleh staff logger?
              </p>
              <p className="text-[11px] text-slate-500 italic">Catatan: {reconciliationNotes || 'Perlu revisi data'}</p>
            </div>
          )
        }
        confirmText={confirmDecision === 'approve' ? 'Ya, Setujui Dokumen' : 'Ya, Kembalikan untuk Revisi'}
        cancelText="Batal"
        variant={confirmDecision === 'approve' ? 'success' : 'danger'}
        isLoading={isProcessing}
      />
    </div>
  );
};
