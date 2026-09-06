import React, { useState, useEffect } from 'react';
import { invoiceApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PrintModal } from '../components/ui/PrintModal';
import { WatermarkDownloadModal } from '../components/loans/WatermarkDownloadModal';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import {
  ListOrdered,
  Search,
  Filter,
  Eye,
  FileText,
  Printer,
  History,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Print Receipt Modal
  const [printModal, setPrintModal] = useState({ isOpen: false, data: null });

  // Watermark Modal
  const [watermarkModalInvoice, setWatermarkModalInvoice] = useState(null);

  const fetchInvoices = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await invoiceApi.getAll({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        per_page: 15,
      });

      if (res.data?.data) {
        setInvoices(res.data.data.data || []);
        setPagination({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          total: res.data.data.total,
        });
      }
    } catch (err) {
      console.error('Fetch invoices error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInvoices(1);
  };

  const handleOpenDetail = async (id) => {
    setIsLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const res = await invoiceApi.getById(id);
      setSelectedInvoice(res.data?.data || null);
    } catch (err) {
      console.error('Fetch invoice detail error:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-corporate-50 font-sans select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-corporate-900 tracking-tight flex items-center gap-2.5">
            <ListOrdered className="w-6 h-6 text-slate-700" />
            Daftar Seluruh Invoice
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Database arsip transaksi, status verifikasi, dan audit log pelacakan fisik
          </p>
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => fetchInvoices(pagination.current_page)}>
          Refresh
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
          <div className="lg:col-span-4">
            <Input
              placeholder="Cari kode tracking, nomor invoice, vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="lg:col-span-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 text-xs"
              options={[
                { value: '', label: 'Semua Status Tahapan' },
                { value: 'received', label: 'Tahap 1: Diterima' },
                { value: 'verified', label: 'Tahap 2: Terverifikasi' },
                { value: 'data_inputted', label: 'Tahap 3: Data Diinput' },
                { value: 'scanned', label: 'Tahap 4: Terpindai' },
                { value: 'reconciled', label: 'Tahap 5: Rekonsiliasi' },
                { value: 'boxed', label: 'Tahap 6: Masuk Boks' },
                { value: 'archived', label: 'Tersimpan di Gudang' },
              ]}
            />
          </div>

          <div className="lg:col-span-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="lg:col-span-2">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="lg:col-span-1 flex items-end">
            <Button type="submit" variant="primary" size="sm" icon={Search} className="w-full h-8">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Invoices Data Table */}
      <Card bodyClassName="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Kode Tracking</th>
                <th className="px-4 py-3">Nama Vendor</th>
                <th className="px-4 py-3">No. Invoice</th>
                <th className="px-4 py-3">Tgl. Terima</th>
                <th className="px-4 py-3 text-right">Total Tagihan</th>
                <th className="px-4 py-3 text-center">Status Alur</th>
                <th className="px-4 py-3 text-center">Lokasi Boks</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada data invoice yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      <div>{inv.tracking_code}</div>
                      {inv.is_loaned && (
                        <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[9px]">
                          Dipinjam: {inv.active_loan_summary?.organization || 'Luar'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{inv.vendor_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{inv.invoice_number || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(inv.received_date)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 font-semibold">
                      {parseFloat(inv.total_amount) > 0 ? formatCurrency(inv.total_amount, inv.currency) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-600">
                      {inv.box ? (
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                          {inv.box.box_number}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(inv.id)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                          title="Lihat Detail & Audit Log"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPrintModal({ isOpen: true, data: inv })}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                          title="Cetak Tanda Terima"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setWatermarkModalInvoice(inv)}
                          className="p-1 rounded hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition"
                          title="Unduh Salinan Ber-Watermark"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.total > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Menampilkan {invoices.length} dari total {pagination.total} invoice
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="secondary"
                disabled={pagination.current_page <= 1}
                onClick={() => fetchInvoices(pagination.current_page - 1)}
              >
                Sebelumnya
              </Button>
              <span className="px-2 font-mono">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => fetchInvoices(pagination.current_page + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Invoice Detail & Activity Audit Log Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedInvoice ? `Detail Invoice: ${selectedInvoice.tracking_code}` : 'Detail Invoice'}
        subtitle="Rincian informasi dokumen, lampiran scan digital, dan audit trail log aktivitas"
        maxWidth="max-w-3xl"
      >
        {selectedInvoice && (
          <div className="space-y-6 text-xs font-sans">
            {/* Top Summary Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Vendor</span>
                <span className="font-semibold text-slate-900">{selectedInvoice.vendor_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">No. Invoice</span>
                <span className="font-mono font-bold text-slate-900">{selectedInvoice.invoice_number || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Status Alur</span>
                <Badge status={selectedInvoice.status} className="mt-0.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Tagihan</span>
                <span className="font-mono font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}
                </span>
              </div>
            </div>

            {/* Quick Actions in Detail Modal */}
            <div className="flex items-center justify-between p-2.5 bg-slate-100/70 border border-slate-200 rounded-lg">
              <span className="text-slate-600 text-[11px] font-medium">
                Pemeriksaan Fisik: <strong className="uppercase text-slate-900">{selectedInvoice.verification_status || 'Belum Verifikasi'}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={Printer}
                  onClick={() => setPrintModal({ isOpen: true, type: 'checklist', data: selectedInvoice })}
                  className="h-7 text-[11px]"
                >
                  Cetak Lembar Check List
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Printer}
                  onClick={() => setPrintModal({ isOpen: true, type: 'receipt', data: selectedInvoice })}
                  className="h-7 text-[11px]"
                >
                  Cetak Tanda Terima
                </Button>
              </div>
            </div>

            {/* Active Loan Banner if Document is on Loan */}
            {selectedInvoice.active_loan_summary && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-amber-950 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wide text-amber-900">
                      Dokumen Sedang Dipinjam Pihak Luar
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-800 font-mono text-[10px] font-bold">
                      {selectedInvoice.active_loan_summary.loan_code}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Instansi: <strong>{selectedInvoice.active_loan_summary.organization}</strong> (PIC: {selectedInvoice.active_loan_summary.borrower_name}) &bull; Batas Kembali:{' '}
                    <strong>{selectedInvoice.active_loan_summary.expected_return_date}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWatermarkModalInvoice(selectedInvoice)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Download Watermark PDF
                </button>
              </div>
            )}

            {/* Financial Details */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Rincian Finansial & Pajak:
              </h4>
              <div className="grid grid-cols-3 gap-2 border border-slate-200 rounded p-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Subtotal (DPP):</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">PPN:</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoice.tax_ppn, selectedInvoice.currency)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Potongan PPh:</span>
                  <span className="font-semibold text-rose-600">{formatCurrency(selectedInvoice.tax_pph, selectedInvoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Digital Attachments */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Berkas Scan Digital ({selectedInvoice.attachments?.length || 0}):
              </h4>
              {(!selectedInvoice.attachments || selectedInvoice.attachments.length === 0) ? (
                <p className="text-slate-400 italic">Belum ada file scan yang diunggah.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedInvoice.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-2.5 rounded border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="font-mono font-medium">{att.file_name}</span>
                        <span className="text-[10px] text-slate-400">({att.file_size_kb} KB • {att.source})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setWatermarkModalInvoice(selectedInvoice)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                          title="Unduh Salinan Ber-Watermark"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Watermark
                        </button>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                        >
                          Buka Asli <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" /> Log Aktivitas Dokumen:
              </h4>
              <div className="space-y-3 border-l-2 border-slate-200 ml-2 pl-4">
                {selectedInvoice.activityLogs?.map((log) => (
                  <div key={log.id} className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(log.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{log.description}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Oleh: {log.user?.name || 'Sistem'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Print Modal (Tanda Terima atau Check List) */}
      <PrintModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal({ isOpen: false, type: 'receipt', data: null })}
        type={printModal.type || 'receipt'}
        data={printModal.data}
      />

      {/* Watermark Download Modal */}
      <WatermarkDownloadModal
        isOpen={!!watermarkModalInvoice}
        invoice={watermarkModalInvoice}
        loan={watermarkModalInvoice?.active_loan_summary}
        onClose={() => setWatermarkModalInvoice(null)}
      />
    </div>
  );
};
