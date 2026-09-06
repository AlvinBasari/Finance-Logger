import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatDateTime } from '../utils/formatters';
import { FilePlus, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, FileUp, FileText, X } from 'lucide-react';

export const Stage1Receipt = () => {
  const navigate = useNavigate();
  const { addToast } = useAppStore();

  const [formData, setFormData] = useState({
    vendor_name: '',
    sender_division: '',
    document_count: 1,
    received_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
  });

  const [softFile, setSoftFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [createdInvoice, setCreatedInvoice] = useState(null);

  // Recent received queue
  const [queue, setQueue] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  const fetchQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const res = await invoiceApi.getAll({ status: 'received', per_page: 10 });
      if (res.data?.data?.data) {
        setQueue(res.data.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Async duplicate check
  const handleCheckDuplicate = async () => {
    if (formData.vendor_name && formData.invoice_number) {
      try {
        const res = await invoiceApi.checkDuplicate({
          vendor_name: formData.vendor_name,
          invoice_number: formData.invoice_number,
        });
        if (res.data.duplicate) {
          setDuplicateWarning(res.data.message);
        } else {
          setDuplicateWarning('');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!formData.vendor_name) {
      addToast('Nama vendor wajib diisi', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      let payload;
      if (softFile) {
        payload = new FormData();
        payload.append('vendor_name', formData.vendor_name);
        payload.append('sender_division', formData.sender_division || '');
        payload.append('document_count', formData.document_count);
        payload.append('received_date', formData.received_date);
        payload.append('invoice_number', formData.invoice_number || '');
        payload.append('soft_file', softFile);
      } else {
        payload = { ...formData };
      }

      const res = await invoiceApi.createReceipt(payload);
      const newInv = res.data.data;
      setCreatedInvoice(newInv);
      addToast(`Penerimaan berkas berhasil dicatat: ${newInv.tracking_code}`, 'success');

      // Reset form
      setFormData({
        vendor_name: '',
        sender_division: '',
        document_count: 1,
        received_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
      });
      setSoftFile(null);
      setDuplicateWarning('');
      fetchQueue();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan tanda terima', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-bold">TAHAP 1</span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Penerimaan Dokumen Fisik</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registrasi awal saat dokumen fisik invoice diterima dari kurir, vendor, atau divisi internal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Registration (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title="Form Registrasi Tanda Terima"
            subtitle="Sistem akan menghasilkan nomor Tracking Code unik (REC-YYYYMMDD-XXXX)"
          >
            <form onSubmit={handlePreSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nama Vendor / Rekanan"
                  placeholder="Contoh: PT Mitra Sarana Logistik"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  onBlur={handleCheckDuplicate}
                  required
                />

                <Input
                  label="Divisi Pengirim / Internal"
                  placeholder="Contoh: Supply Chain / IT / GA"
                  value={formData.sender_division}
                  onChange={(e) => setFormData({ ...formData, sender_division: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Tanggal Terima Fisik"
                  type="date"
                  value={formData.received_date}
                  onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                  required
                />

                <Input
                  label="Jumlah Lembar Berkas"
                  type="number"
                  min="1"
                  value={formData.document_count}
                  onChange={(e) => setFormData({ ...formData, document_count: parseInt(e.target.value) || 1 })}
                  required
                />

                <Input
                  label="No. Invoice Vendor (Opsional)"
                  placeholder="INV/2026/..."
                  isMonospace
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  onBlur={handleCheckDuplicate}
                />
              </div>

              {/* Soft File Upload Area */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Unggah Soft File Vendor (PDF / Digital Document) <span className="text-slate-400 font-normal lowercase">(opsional)</span>
                </label>
                {!softFile ? (
                  <label className="border-2 border-dashed border-slate-300 hover:border-corporate-900 rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition group">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 32 * 1024 * 1024) {
                            addToast('Ukuran file maksimal 32MB', 'error');
                            return;
                          }
                          setSoftFile(file);
                        }
                      }}
                    />
                    <FileUp className="w-6 h-6 text-slate-400 group-hover:text-corporate-900 transition" />
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-corporate-900">
                      Klik untuk memilih file PDF / Dokumen dari Vendor
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Format didukung: PDF, PNG, JPG (Maks. 32MB)
                    </span>
                  </label>
                ) : (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900 truncate">{softFile.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {(softFile.size / 1024).toFixed(0)} KB • Berkas Soft File Vendor Terlampir
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSoftFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                      title="Hapus File"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {duplicateWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{duplicateWarning}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={FilePlus}
                  isLoading={isSubmitting}
                >
                  Simpan Penerimaan Berkas
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Panel: Pending Queue for Stage 2 (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            title="Antrean Masuk (Menunggu Verifikasi)"
            subtitle="Dokumen yang baru diterima & siap dicek fisiknya"
            action={
              <button
                onClick={fetchQueue}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                title="Refresh Antrean"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            }
          >
            {queue.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                Semua dokumen yang diterima telah diverifikasi.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                {queue.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{item.tracking_code}</span>
                        <span className="text-[10px] text-slate-400">({item.document_count} Lembar)</span>
                      </div>
                      <p className="font-medium text-slate-700 truncate max-w-[200px]">{item.vendor_name}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(item.created_at)}</p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={ArrowRight}
                      onClick={() => navigate(`/stage-2?id=${item.id}`)}
                    >
                      Verifikasi
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Confirmation Modal to Avoid Accidental Submit */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmedSubmit}
        title="Konfirmasi Penerimaan Dokumen"
        message={
          <div>
            <p className="mb-2">Pastikan data fisik dokumen invoice yang diterima sudah sesuai:</p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700">
              <li>Vendor: <b>{formData.vendor_name}</b></li>
              <li>Divisi: <b>{formData.sender_division || '-'}</b></li>
              <li>Jumlah: <b>{formData.document_count} Lembar Fisik</b></li>
              <li>Tanggal Terima: <b>{formData.received_date}</b></li>
              <li>Soft File Vendor: <b>{softFile ? `${softFile.name} (${(softFile.size / 1024).toFixed(0)} KB)` : 'Tidak ada (Fisik saja)'}</b></li>
            </ul>
          </div>
        }
        confirmText="Ya, Simpan Penerimaan"
        cancelText="Periksa Kembali"
        variant="primary"
        isLoading={isSubmitting}
      />
    </div>
  );
};
