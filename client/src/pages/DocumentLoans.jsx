import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loanApi } from '../services/api';
import {
  FileText,
  Plus,
  Search,
  RotateCcw,
  Printer,
  Mail,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Calendar,
  Layers,
  Sparkles,
  Archive,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { CreateLoanModal } from '../components/loans/CreateLoanModal';
import { ReturnLoanModal } from '../components/loans/ReturnLoanModal';
import { LoanBastModal } from '../components/loans/LoanBastModal';
import { WatermarkDownloadModal } from '../components/loans/WatermarkDownloadModal';
import { showToast } from '../components/ui/Toast';

export const DocumentLoans = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedLoanId, setExpandedLoanId] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState(null);
  const [selectedLoanForBast, setSelectedLoanForBast] = useState(null);
  const [selectedInvoiceForWatermark, setSelectedInvoiceForWatermark] = useState(null);
  const [selectedLoanForWatermark, setSelectedLoanForWatermark] = useState(null);

  // Fetch KPI stats
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['loan-stats'],
    queryFn: () => loanApi.getStats(),
  });

  const stats = statsData?.data?.data || {
    total_loans: 0,
    active_loans: 0,
    due_soon_loans: 0,
    overdue_loans: 0,
    returned_loans: 0,
  };

  // Fetch loans list
  const { data: loansData, isLoading, refetch } = useQuery({
    queryKey: ['loans-list', search, statusFilter, loanTypeFilter, page],
    queryFn: () =>
      loanApi.getAll({
        search,
        status: statusFilter,
        loan_type: loanTypeFilter,
        page,
        per_page: 10,
      }),
  });

  const loans = loansData?.data?.data || [];
  const meta = loansData?.data?.meta || { current_page: 1, last_page: 1, total: 0 };

  // Manual reminder email trigger mutation
  const reminderMutation = useMutation({
    mutationFn: (loanId) => loanApi.sendReminder(loanId),
    onSuccess: (res) => {
      showToast(res.data?.message || 'Email pengingat berhasil dikirim!', 'success');
      refetch();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Gagal mengirim email pengingat.', 'error');
    },
  });

  const handleSendReminder = (loan) => {
    if (!loan.contact_email) {
      showToast('Peminjaman ini tidak memiliki email kontak PIC.', 'warning');
      return;
    }
    reminderMutation.mutate(loan.id);
  };

  const toggleExpand = (loanId) => {
    setExpandedLoanId((prev) => (prev === loanId ? null : loanId));
  };

  const handleOpenWatermark = (invoice, loan) => {
    setSelectedInvoiceForWatermark(invoice);
    setSelectedLoanForWatermark(loan);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-corporate-50">
      {/* 1. Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-corporate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-600" />
            Peminjaman Dokumen Arsip
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen dan pelacakan berkas fisik & digital yang dipinjam oleh pihak luar (KAP, Pajak, Vendor, Legal)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetch();
              refetchStats();
            }}
            className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-lg transition border border-slate-200 bg-white"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Buat Peminjaman Baru
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Aktif Dipinjam
            </span>
            <span className="text-2xl font-black text-indigo-900 mt-0.5 block">
              {stats.active_loans}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Berkas sedang di luar</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              Jatuh Tempo (H-3)
            </span>
            <span className="text-2xl font-black text-amber-900 mt-0.5 block">
              {stats.due_soon_loans}
            </span>
            <span className="text-[11px] text-amber-600/80 mt-0.5 block">Perlu pengingat email</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
              Overdue / Terlambat
            </span>
            <span className="text-2xl font-black text-rose-900 mt-0.5 block">
              {stats.overdue_loans}
            </span>
            <span className="text-[11px] text-rose-600/80 mt-0.5 block">Melewati batas waktu</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Total Selesai
            </span>
            <span className="text-2xl font-black text-emerald-900 mt-0.5 block">
              {stats.returned_loans}
            </span>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block">Dikembalikan ke gudang</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { label: 'Semua', value: '' },
              { label: 'Aktif', value: 'active' },
              { label: 'Jatuh Tempo Segera', value: 'due_soon' },
              { label: 'Overdue', value: 'overdue' },
              { label: 'Selesai Dikembalikan', value: 'returned' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === tab.value
                    ? 'bg-corporate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Loan Type Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={loanTypeFilter}
              onChange={(e) => {
                setLoanTypeFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Tipe</option>
              <option value="physical">Fisik (Hardcopy)</option>
              <option value="digital">Digital (Watermark)</option>
            </select>

            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari instansi / PIC / no pinjam..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Loans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th className="py-3 px-4">No. Pinjam & Tipe</th>
                <th className="py-3 px-4">Instansi & Peminjam</th>
                <th className="py-3 px-4">Keperluan</th>
                <th className="py-3 px-4 text-center">Jml Dokumen</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Memuat data peminjaman...
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Tidak ada data peminjaman dokumen yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const isExpanded = expandedLoanId === loan.id;
                  return (
                    <React.Fragment key={loan.id}>
                      <tr
                        className={`hover:bg-slate-50/80 transition cursor-pointer ${
                          isExpanded ? 'bg-indigo-50/20' : ''
                        }`}
                        onClick={() => toggleExpand(loan.id)}
                      >
                        <td className="py-3 px-4 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 mx-auto text-indigo-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 mx-auto text-slate-400" />
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-indigo-900 block">
                            {loan.loan_code}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              loan.loan_type === 'digital'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {loan.loan_type === 'digital' ? (
                              <Sparkles className="w-3 h-3" />
                            ) : (
                              <Layers className="w-3 h-3" />
                            )}
                            {loan.loan_type}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{loan.organization}</div>
                          <div className="text-[11px] text-slate-500">
                            {loan.borrower_name} &bull; {loan.contact_phone}
                          </div>
                          {loan.contact_email && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {loan.contact_email}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-800 line-clamp-1">{loan.purpose}</div>
                          {loan.reference_letter_no && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Ref: {loan.reference_letter_no}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-slate-100 font-bold text-slate-800 text-xs">
                            {loan.total_items} Berkas
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">
                            {loan.expected_return_date
                              ? new Date(loan.expected_return_date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </div>
                          {loan.status !== 'returned' && (
                            <div>
                              {loan.is_overdue ? (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                  Terlambat {Math.abs(loan.days_remaining)} Hari
                                </span>
                              ) : loan.days_remaining <= 3 ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                  Sisa {loan.days_remaining} Hari
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  Sisa {loan.days_remaining} Hari
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              loan.status === 'returned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : loan.status === 'partial_returned'
                                ? 'bg-amber-100 text-amber-800'
                                : loan.is_overdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {loan.status === 'returned'
                              ? 'Selesai'
                              : loan.status === 'partial_returned'
                              ? 'Sebagian Kembali'
                              : loan.is_overdue
                              ? 'Overdue'
                              : 'Aktif'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Cetak BAST */}
                            <button
                              onClick={() => setSelectedLoanForBast(loan)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="Cetak Berita Acara Serah Terima (BAST)"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Kirim Email Reminder */}
                            {loan.status !== 'returned' && loan.contact_email && (
                              <button
                                onClick={() => handleSendReminder(loan)}
                                disabled={reminderMutation.isPending}
                                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition disabled:opacity-50"
                                title="Kirim Email Pengingat / Overdue"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            )}

                            {/* Proses Pengembalian */}
                            {loan.status !== 'returned' && (
                              <button
                                onClick={() => setSelectedLoanForReturn(loan)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
                                title="Proses Pengembalian Dokumen"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Pengembalian
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Items Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={8} className="p-4 pl-12">
                            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                  <Layers className="w-4 h-4 text-indigo-600" />
                                  Rincian Dokumen Invoice yang Dipinjam ({loan.items?.length || 0} Item)
                                </h4>
                                <div className="text-[11px] text-slate-500">
                                  Dicatat oleh: <strong>{loan.creator?.name || 'Staf'}</strong> pada{' '}
                                  {new Date(loan.created_at).toLocaleDateString('id-ID')}
                                </div>
                              </div>

                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                  <tr>
                                    <th className="py-2 px-3 w-8">No</th>
                                    <th className="py-2 px-3">Kode Tracking</th>
                                    <th className="py-2 px-3">Vendor & No. Invoice</th>
                                    <th className="py-2 px-3">Lokasi Boks Gudang Asal</th>
                                    <th className="py-2 px-3">Nominal Total</th>
                                    <th className="py-2 px-3 text-center">Status Item</th>
                                    <th className="py-2 px-3 text-right">Aksi Watermark</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {loan.items?.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                        {item.invoice?.tracking_code}
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="font-medium text-slate-800">
                                          {item.invoice?.vendor_name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                          {item.invoice?.invoice_number || '-'}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3">
                                        {item.original_box || item.invoice?.box ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-mono text-[10px]">
                                            <Archive className="w-3 h-3 text-amber-700" />
                                            {(item.original_box || item.invoice?.box).box_number}{' '}
                                            {(item.original_box || item.invoice?.box).rack_location
                                              ? `(Rak ${(item.original_box || item.invoice?.box).rack_location})`
                                              : ''}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 italic text-[11px]">
                                            Belum di boks
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 font-medium text-slate-700">
                                        {item.invoice?.currency || 'IDR'}{' '}
                                        {Number(item.invoice?.total_amount || 0).toLocaleString('id-ID')}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <span
                                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            item.status === 'returned'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : item.status === 'damaged'
                                              ? 'bg-amber-100 text-amber-800'
                                              : item.status === 'lost'
                                              ? 'bg-rose-100 text-rose-800'
                                              : 'bg-slate-100 text-slate-700'
                                          }`}
                                        >
                                          {item.status}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-right">
                                        <button
                                          onClick={() => handleOpenWatermark(item.invoice, loan)}
                                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold flex items-center gap-1 ml-auto transition"
                                          title="Unduh Softcopy PDF Ber-Watermark"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          Unduh Watermark
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Halaman <strong>{meta.current_page}</strong> dari <strong>{meta.last_page}</strong> (Total {meta.total} Peminjaman)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100 transition"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100 transition"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLoanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          refetchStats();
        }}
      />

      <ReturnLoanModal
        isOpen={!!selectedLoanForReturn}
        loan={selectedLoanForReturn}
        onClose={() => setSelectedLoanForReturn(null)}
        onSuccess={() => {
          refetch();
          refetchStats();
        }}
      />

      <LoanBastModal
        isOpen={!!selectedLoanForBast}
        loan={selectedLoanForBast}
        onClose={() => setSelectedLoanForBast(null)}
      />

      <WatermarkDownloadModal
        isOpen={!!selectedInvoiceForWatermark}
        invoice={selectedInvoiceForWatermark}
        loan={selectedLoanForWatermark}
        onClose={() => {
          setSelectedInvoiceForWatermark(null);
          setSelectedLoanForWatermark(null);
        }}
      />
    </div>
  );
};
