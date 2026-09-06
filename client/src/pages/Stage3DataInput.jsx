import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  FileSpreadsheet,
  Calculator,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Coins,
} from 'lucide-react';

export const Stage3DataInput = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('id');
  const { addToast } = useAppStore();

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'IDR',
    subtotal: 0,
    tax_ppn: 0,
    tax_pph: 0,
    total_amount: 0,
  });

  const [ppnRate, setPpnRate] = useState('11'); // '11' | '12' | '0' | 'custom'

  const loadPendingInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await invoiceApi.getAll({ status: 'verified', per_page: 25 });
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
    const sub = parseFloat(inv.subtotal) || 0;
    const ppn = parseFloat(inv.tax_ppn) || 0;
    const pph = parseFloat(inv.tax_pph) || 0;
    const total = parseFloat(inv.total_amount) || (sub + ppn - pph);

    setFormData({
      invoice_number: inv.invoice_number || '',
      invoice_date: inv.invoice_date || new Date().toISOString().split('T')[0],
      due_date: inv.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: inv.currency || 'IDR',
      subtotal: sub,
      tax_ppn: ppn,
      tax_pph: pph,
      total_amount: total,
    });
  };

  useEffect(() => {
    loadPendingInvoices();
  }, [invoiceIdParam]);

  // Calculation logic
  const handleSubtotalChange = (val) => {
    const num = parseFloat(val) || 0;
    let newPpn = formData.tax_ppn;

    if (ppnRate === '11') {
      newPpn = Math.round(num * 0.11 * 100) / 100;
    } else if (ppnRate === '12') {
      newPpn = Math.round(num * 0.12 * 100) / 100;
    } else if (ppnRate === '0') {
      newPpn = 0;
    }

    const total = num + newPpn - (parseFloat(formData.tax_pph) || 0);

    setFormData((prev) => ({
      ...prev,
      subtotal: num,
      tax_ppn: newPpn,
      total_amount: total > 0 ? total : 0,
    }));
  };

  const applyPpnPreset = (rate) => {
    setPpnRate(rate);
    const sub = parseFloat(formData.subtotal) || 0;
    let newPpn = 0;
    if (rate === '11') newPpn = Math.round(sub * 0.11 * 100) / 100;
    else if (rate === '12') newPpn = Math.round(sub * 0.12 * 100) / 100;
    else if (rate === '0') newPpn = 0;

    const total = sub + newPpn - (parseFloat(formData.tax_pph) || 0);
    setFormData((prev) => ({
      ...prev,
      tax_ppn: newPpn,
      total_amount: total > 0 ? total : 0,
    }));
  };

  const handlePphChange = (val) => {
    const num = parseFloat(val) || 0;
    const sub = parseFloat(formData.subtotal) || 0;
    const ppn = parseFloat(formData.tax_ppn) || 0;
    const total = sub + ppn - num;

    setFormData((prev) => ({
      ...prev,
      tax_pph: num,
      total_amount: total > 0 ? total : 0,
    }));
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (!formData.invoice_number) {
      addToast('Nomor invoice vendor wajib diisi', 'error');
      return;
    }
    if (formData.subtotal <= 0) {
      addToast('Nilai DPP (Subtotal) harus lebih dari 0', 'error');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    try {
      const res = await invoiceApi.updateFinancials(selectedInvoice.id, formData);
      addToast(`Data finansial invoice ${formData.invoice_number} berhasil disimpan`, 'success');
      // Direct to Stage 4 (Digitalisasi Scanner)
      navigate(`/stage-4?id=${selectedInvoice.id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan data finansial', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">TAHAP 3</span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Penginputan Data Finansial Invoice</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Input detail nilai tagihan, DPP, PPN 11%/12%, PPh, dan parameter akuntansi ke database pusat.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Pending Verified Invoices Queue (4 cols) */}
        <div className="lg:col-span-4">
          <Card
            title="Antrean Input Finansial"
            subtitle="Dokumen terverifikasi yang siap diinput nominalnya"
          >
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 stroke-[1.5] mb-2" />
                Semua dokumen terverifikasi telah diinput datanya.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {invoices.map((inv) => (
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
                      <Badge status={inv.status} />
                    </div>
                    <p className="font-medium text-slate-800 truncate">{inv.vendor_name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(inv.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Financial Form (8 cols) */}
        <div className="lg:col-span-8">
          {selectedInvoice ? (
            <Card
              title={`Input Finansial: ${selectedInvoice.tracking_code}`}
              subtitle={`Vendor: ${selectedInvoice.vendor_name}`}
            >
              <form onSubmit={handlePreSubmit} className="space-y-5">
                {/* 1. Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nomor Invoice Vendor"
                    placeholder="Contoh: INV/2026/08/099"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    isMonospace
                    required
                  />

                  <Select
                    label="Mata Uang (Currency)"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    options={[
                      { value: 'IDR', label: 'IDR - Rupiah Indonesia' },
                      { value: 'USD', label: 'USD - US Dollar' },
                      { value: 'EUR', label: 'EUR - Euro' },
                      { value: 'SGD', label: 'SGD - Singapore Dollar' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tanggal Invoice (Vendor)"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    required
                  />

                  <Input
                    label="Tanggal Jatuh Tempo (Due Date)"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Perhitungan Nilai Finansial & Pajak:
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DPP (Subtotal) */}
                    <Input
                      label="Subtotal / DPP (Dasar Pengenaan Pajak)"
                      type="number"
                      step="any"
                      min="0"
                      isCurrency
                      currencyPrefix={formData.currency === 'IDR' ? 'Rp' : formData.currency}
                      value={formData.subtotal || ''}
                      onChange={(e) => handleSubtotalChange(e.target.value)}
                      placeholder="0.00"
                      required
                    />

                    {/* PPN Presets & Field */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-600 tracking-wider uppercase">
                          Pajak Pertambahan Nilai (PPN)
                        </label>
                        <div className="flex items-center gap-1">
                          {['11', '12', '0'].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => applyPpnPreset(rate)}
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                                ppnRate === rate
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {rate === '0' ? 'Bebas PPN' : `${rate}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        isCurrency
                        currencyPrefix={formData.currency === 'IDR' ? 'Rp' : formData.currency}
                        value={formData.tax_ppn || ''}
                        onChange={(e) => {
                          setPpnRate('custom');
                          const ppn = parseFloat(e.target.value) || 0;
                          const sub = parseFloat(formData.subtotal) || 0;
                          const pph = parseFloat(formData.tax_pph) || 0;
                          setFormData((prev) => ({
                            ...prev,
                            tax_ppn: ppn,
                            total_amount: sub + ppn - pph,
                          }));
                        }}
                      />
                    </div>

                    {/* PPh (Potongan) */}
                    <Input
                      label="Pajak Penghasilan (PPh 23 / 4 ayat 2) - Pengurang"
                      type="number"
                      step="any"
                      min="0"
                      isCurrency
                      currencyPrefix={formData.currency === 'IDR' ? 'Rp' : formData.currency}
                      value={formData.tax_pph || ''}
                      onChange={(e) => handlePphChange(e.target.value)}
                      placeholder="0.00 (jika ada)"
                    />

                    {/* Total Amount (Highlight Card) */}
                    <div className="p-3 bg-slate-900 text-white rounded-lg flex flex-col justify-between shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Tagihan Akhir (Net Amount):
                      </span>
                      <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                        {formatCurrency(formData.total_amount, formData.currency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="secondary" onClick={() => navigate(`/stage-2?id=${selectedInvoice.id}`)}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Verifikasi
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    icon={ArrowRight}
                    isLoading={isSaving}
                  >
                    Simpan & Lanjut ke Digitalisasi Scan (Tahap 4)
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card>
              <div className="py-16 text-center text-slate-400 text-xs">
                <FileSpreadsheet className="w-12 h-12 mx-auto stroke-[1.5] mb-2 text-slate-300" />
                Pilih dokumen dari antrean di sebelah kiri untuk menginput data finansial.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Avoid Accidental Submit */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmedSubmit}
        title="Konfirmasi Penyimpanan Data Finansial"
        message={
          <div>
            <p className="mb-2">Periksa kembali rincian angka finansial invoice vendor <b>{selectedInvoice?.vendor_name}</b>:</p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Invoice:</span>
                <span className="font-mono font-bold">{formData.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal (DPP):</span>
                <span className="font-mono">{formatCurrency(formData.subtotal, formData.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PPN:</span>
                <span className="font-mono">{formatCurrency(formData.tax_ppn, formData.currency)}</span>
              </div>
              {parseFloat(formData.tax_pph) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Potongan PPh:</span>
                  <span className="font-mono text-rose-600">- {formatCurrency(formData.tax_pph, formData.currency)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                <span>Total Net Tagihan:</span>
                <span className="font-mono text-emerald-700">{formatCurrency(formData.total_amount, formData.currency)}</span>
              </div>
            </div>
          </div>
        }
        confirmText="Ya, Simpan & Lanjut ke Scan"
        cancelText="Periksa Lagi"
        variant="primary"
        isLoading={isSaving}
      />
    </div>
  );
};
