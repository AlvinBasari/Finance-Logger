import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { PrintModal } from '../components/ui/PrintModal';
import { PdfViewer } from '../components/ui/PdfViewer';
import { formatDateTime } from '../utils/formatters';
import {
  INVOICE_CHECKLIST_SECTIONS,
  getInitialChecklistState,
} from '../constants/invoiceChecklist';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  FileText,
  Printer,
  Eye,
  EyeOff,
  RefreshCw,
  Layers,
  Sparkles,
  ShoppingBag,
  Wrench,
  Check,
} from 'lucide-react';

export const Stage2Verification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('id');
  const { addToast } = useAppStore();

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Soft File View Toggle & Print Receipt State
  const [showSoftFile, setShowSoftFile] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printModalType, setPrintModalType] = useState('receipt'); // 'receipt' | 'checklist'

  // Order Scope Preset Filter ('all', 'po', 'so')
  const [orderScope, setOrderScope] = useState('all');

  const [checklist, setChecklist] = useState(getInitialChecklistState());
  const [verificationStatus, setVerificationStatus] = useState('complete');
  const [notes, setNotes] = useState('');

  const loadPendingInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await invoiceApi.getAll({ status: 'received', per_page: 25 });
      const list = res.data?.data?.data || [];
      setInvoices(list);

      if (invoiceIdParam) {
        const found = list.find((i) => i.id === parseInt(invoiceIdParam));
        if (found) {
          selectInvoice(found);
        } else {
          // Fetch directly by ID
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
    const initial = getInitialChecklistState();
    if (inv.verification_checklist && typeof inv.verification_checklist === 'object') {
      Object.keys(inv.verification_checklist).forEach((k) => {
        initial[k] = !!inv.verification_checklist[k];
      });
    }
    setChecklist(initial);
    setVerificationStatus(inv.verification_status || 'complete');
    setNotes(inv.verification_notes || '');
    setShowSoftFile(true);
  };

  useEffect(() => {
    loadPendingInvoices();
  }, [invoiceIdParam]);

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCheckAllApplicable = (check = true) => {
    setChecklist((prev) => {
      const next = { ...prev };
      INVOICE_CHECKLIST_SECTIONS.forEach((sec) => {
        if (orderScope === 'all' || sec.scope === 'all' || sec.scope === orderScope) {
          sec.items.forEach((item) => {
            // If optional and checking all, only check if not strictly optional or keep optional checked
            next[item.key] = check;
          });
        }
      });
      return next;
    });
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePreSaveVerification = () => {
    if (!selectedInvoice) return;
    setShowConfirmModal(true);
  };

  const handleSaveVerification = async () => {
    if (!selectedInvoice) return;

    setShowConfirmModal(false);
    setIsSaving(true);
    try {
      const res = await invoiceApi.verifyChecklist(selectedInvoice.id, {
        checklist,
        verification_status: verificationStatus,
        notes,
      });

      const updated = res.data?.data || selectedInvoice;
      setSelectedInvoice(updated);
      addToast(`Hasil verifikasi fisik ${selectedInvoice.tracking_code} berhasil disimpan`, 'success');

      if (verificationStatus === 'complete') {
        // Show Print Modal for Bukti Tanda Terima / Checklist
        setPrintModalType('receipt');
        setShowPrintModal(true);
      } else {
        loadPendingInvoices();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan hasil verifikasi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Find soft file attachment or URL
  const softFileAttachment = selectedInvoice?.attachments?.find(
    (a) => a.source === 'vendor_softfile'
  ) || (selectedInvoice?.attachments?.length > 0 ? selectedInvoice.attachments[0] : null);

  const softFileUrl = selectedInvoice?.soft_file_url || softFileAttachment?.url;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">TAHAP 2</span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pemeriksaan Kelengkapan & Fisik Dokumen</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bandingkan soft file digital vendor dengan fisik dokumen asli, verifikasi kelengkapan, dan cetak Bukti Tanda Terima.
          </p>
        </div>

        {selectedInvoice && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={() => setShowPrintModal(true)}
              title="Cetak Bukti Tanda Terima Dokumen"
            >
              Cetak Tanda Terima
            </Button>

            {softFileUrl && (
              <Button
                variant={showSoftFile ? 'secondary' : 'outline'}
                size="sm"
                icon={showSoftFile ? EyeOff : Eye}
                onClick={() => setShowSoftFile(!showSoftFile)}
              >
                {showSoftFile ? 'Sembunyikan Soft File' : 'Buka Soft File'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Pending Invoices Queue (3 or 4 cols) */}
        <div className={softFileUrl && showSoftFile ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <Card
            title="Antrean Periksa Fisik"
            subtitle="Pilih dokumen untuk diperiksa"
            action={
              <button
                onClick={loadPendingInvoices}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                title="Refresh Antrean"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            }
          >
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 stroke-[1.5] mb-2" />
                Tidak ada dokumen pending verifikasi.
              </div>
            ) : (
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {invoices.map((inv) => {
                  const hasSoft = inv.soft_file_url || inv.attachments?.some((a) => a.source === 'vendor_softfile');
                  return (
                    <div
                      key={inv.id}
                      onClick={() => selectInvoice(inv)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                        selectedInvoice?.id === inv.id
                          ? 'border-slate-900 bg-slate-50 shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50/50 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-900">{inv.tracking_code}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{inv.document_count} Lembar</span>
                      </div>
                      <p className="font-medium text-slate-800 truncate">{inv.vendor_name}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">{formatDateTime(inv.created_at)}</span>
                        {hasSoft ? (
                          <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                            <FileText className="w-3 h-3" /> Soft File
                          </span>
                        ) : (
                          <span className="text-slate-400">Fisik saja</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Center: Soft File Viewer (5 cols if active) */}
        {selectedInvoice && softFileUrl && showSoftFile && (
          <div className="lg:col-span-5 flex flex-col">
            <Card
              title="Soft File Vendor (Digital)"
              subtitle={`${softFileAttachment?.file_name || 'Dokumen Soft File'} • Pembanding Fisik`}
              action={
                <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold">
                  Lampiran Asli Vendor
                </span>
              }
            >
              <div className="h-[520px] rounded-lg overflow-hidden border border-slate-700">
                <PdfViewer
                  fileUrl={softFileUrl}
                  fileName={softFileAttachment?.file_name || 'Softfile Vendor'}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                * Cocokkan lembaran fisik invoice di meja dengan soft file vendor di atas.
              </p>
            </Card>
          </div>
        )}

        {/* Right Side: Verification Checklist Form (4 cols if soft file active, else 8 cols) */}
        <div className={selectedInvoice && softFileUrl && showSoftFile ? 'lg:col-span-4' : 'lg:col-span-8'}>
          {selectedInvoice ? (
            <Card
              title={`Verifikasi: ${selectedInvoice.tracking_code}`}
              subtitle={`Vendor: ${selectedInvoice.vendor_name}`}
              action={
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Printer}
                    onClick={() => {
                      setPrintModalType('checklist');
                      setShowPrintModal(true);
                    }}
                    className="h-7 text-[11px]"
                  >
                    Cetak Lembar Check List
                  </Button>
                  <Badge status={selectedInvoice.status} />
                </div>
              }
            >
              <div className="space-y-5">
                {/* Meta details banner */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Divisi Pengirim:</span>
                    <span className="font-semibold text-slate-800">{selectedInvoice.sender_division || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jumlah Lembar Fisik:</span>
                    <span className="font-semibold text-slate-800">{selectedInvoice.document_count} Lembar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Invoice Vendor:</span>
                    <span className="font-mono font-semibold text-slate-900">{selectedInvoice.invoice_number || '-'}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Status Soft File:</span>
                    {softFileUrl ? (
                      <span className="text-indigo-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Tersedia ({softFileAttachment?.file_name})
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Tidak ada (Hanya Berkas Fisik)
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. Star Energy Geothermal Check List Invoice */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-indigo-600" />
                        Check List Kelengkapan Dokumen (Standar Star Energy)
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Pilih tipe pesanan (PO / SO) untuk menyesuaikan persyaratan wajib
                      </p>
                    </div>

                    {/* Scope Selector: ALL, PO, SO */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setOrderScope('all')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          orderScope === 'all'
                            ? 'bg-corporate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderScope('po')}
                        className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                          orderScope === 'po'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ShoppingBag className="w-3 h-3" /> PO (Barang)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderScope('so')}
                        className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                          orderScope === 'so'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Wrench className="w-3 h-3" /> SO (Jasa)
                      </button>
                    </div>
                  </div>

                  {/* Quick Check All / Clear buttons */}
                  <div className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-200 mb-3 text-[11px]">
                    <span className="text-slate-500">
                      Preset aktif:{' '}
                      <strong className="text-slate-800 uppercase">
                        {orderScope === 'po'
                          ? 'Purchase Order (Poin 1, 2, 4, 5, 7)'
                          : orderScope === 'so'
                          ? 'Service Order (Poin 1, 2, 3, 6, 7)'
                          : 'Seluruh Kategori (1 - 7)'}
                      </strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCheckAllApplicable(true)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                      >
                        Centang Semua
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleCheckAllApplicable(false)}
                        className="text-slate-500 hover:text-slate-700 hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Categorized Sections Grid (Scrollable) */}
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {INVOICE_CHECKLIST_SECTIONS.map((section) => {
                      const isDimmed =
                        orderScope !== 'all' &&
                        section.scope !== 'all' &&
                        section.scope !== orderScope;

                      return (
                        <div
                          key={section.number}
                          className={`rounded-lg border transition ${
                            isDimmed
                              ? 'border-slate-100 bg-slate-50/40 opacity-50'
                              : 'border-slate-200 bg-white shadow-2xs'
                          }`}
                        >
                          {/* Section Header */}
                          <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-corporate-900 text-white flex items-center justify-center font-bold text-[10px]">
                                {section.number}
                              </span>
                              <span className="font-bold text-[11px] text-slate-800 tracking-tight">
                                {section.title}
                              </span>
                            </div>
                            {section.badge && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                                {section.badge}
                              </span>
                            )}
                          </div>

                          {/* Section Items */}
                          <div className="p-2 space-y-1.5 divide-y divide-slate-50">
                            {section.items.map((item) => {
                              const isChecked = !!checklist[item.key];
                              return (
                                <div
                                  key={item.key}
                                  onClick={() => toggleChecklist(item.key)}
                                  className={`pt-1.5 first:pt-0 p-2 rounded transition cursor-pointer flex items-start gap-2.5 ${
                                    isChecked
                                      ? 'bg-emerald-50/60 text-emerald-950 font-medium'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    {isChecked ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-300" />
                                    )}
                                  </div>
                                  <div className="flex-1 text-xs">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={isChecked ? 'font-semibold text-emerald-950' : 'text-slate-800'}>
                                        {item.label}
                                      </span>
                                      {item.isOptional && (
                                        <span className="text-[9px] text-slate-400 font-normal italic">
                                          (** Jika ada)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Verification Status Selector */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    2. Status Hasil Pemeriksaan:
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setVerificationStatus('complete')}
                      className={`p-2 rounded-lg border font-medium flex flex-col items-center gap-1 transition cursor-pointer ${
                        verificationStatus === 'complete'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] text-center">Lengkap (Complete)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationStatus('incomplete')}
                      className={`p-2 rounded-lg border font-medium flex flex-col items-center gap-1 transition cursor-pointer ${
                        verificationStatus === 'incomplete'
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-[11px] text-center">Pending Susulan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationStatus('rejected')}
                      className={`p-2 rounded-lg border font-medium flex flex-col items-center gap-1 transition cursor-pointer ${
                        verificationStatus === 'rejected'
                          ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-[11px] text-center">Ditolak / Cacat</span>
                    </button>
                  </div>
                </div>

                {/* 3. Notes Box */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 tracking-wider uppercase block mb-1">
                    3. Catatan Pemeriksa:
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan kelengkapan fisik..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-sans"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button variant="secondary" size="sm" onClick={() => navigate('/stage-1')}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Penerimaan
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={verificationStatus === 'complete' ? Printer : ArrowRight}
                    onClick={handlePreSaveVerification}
                    isLoading={isSaving}
                  >
                    {verificationStatus === 'complete'
                      ? 'Simpan & Cetak Tanda Terima'
                      : 'Simpan Catatan Verifikasi'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="py-16 text-center text-slate-400 text-xs">
                <FileText className="w-12 h-12 mx-auto stroke-[1.5] mb-2 text-slate-300" />
                Pilih dokumen dari antrean di sebelah kiri untuk melakukan verifikasi fisik.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Avoid Accidental Submit */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSaveVerification}
        title="Konfirmasi Hasil Verifikasi Fisik"
        message={
          <div>
            <p className="mb-2">Simpan hasil verifikasi untuk dokumen <b>{selectedInvoice?.tracking_code}</b> ({selectedInvoice?.vendor_name})?</p>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] space-y-1">
              <div>Status: <b className="uppercase">{verificationStatus}</b></div>
              <div>Catatan: {notes || '-'}</div>
            </div>
            {verificationStatus === 'complete' && (
              <p className="mt-2 text-emerald-700 font-medium text-[11px]">
                ✓ Setelah ini sistem akan otomatis membuka dialog Cetak Bukti Tanda Terima resmi.
              </p>
            )}
          </div>
        }
        confirmText="Ya, Simpan Hasil Verifikasi"
        cancelText="Batal"
        variant={verificationStatus === 'rejected' ? 'danger' : verificationStatus === 'incomplete' ? 'warning' : 'success'}
        isLoading={isSaving}
      />

      {/* Printable Modal (Tanda Terima atau Lembar Check List) */}
      <PrintModal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          if (printModalType === 'receipt' && verificationStatus === 'complete' && selectedInvoice) {
            // After closing receipt print modal, allow navigate to stage 3
            navigate(`/stage-3?id=${selectedInvoice.id}`);
          }
        }}
        type={printModalType}
        data={{
          ...selectedInvoice,
          verification_checklist: checklist,
          verification_status: verificationStatus,
          verification_notes: notes,
        }}
      />
    </div>
  );
};
