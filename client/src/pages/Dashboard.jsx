import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { invoiceApi, loanApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatDate, getStatusConfig } from '../utils/formatters';
import {
  FilePlus,
  FileCheck,
  FileSpreadsheet,
  ScanLine,
  SplitSquareVertical,
  Archive,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  FolderClock,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loanStats, setLoanStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [invRes, loanRes] = await Promise.all([
        invoiceApi.getStats(),
        loanApi.getStats().catch(() => ({ data: { data: null } })),
      ]);
      if (invRes.data?.data) {
        setStats(invRes.data.data.counts);
        setRecent(invRes.data.data.recent || []);
      }
      if (loanRes.data?.data) {
        setLoanStats(loanRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stages = [
    {
      id: 1,
      title: '1. Penerimaan',
      desc: 'Berkas fisik baru masuk',
      count: stats?.received || 0,
      icon: FilePlus,
      path: '/stage-1',
      color: 'border-slate-300 text-slate-700 bg-slate-50',
    },
    {
      id: 2,
      title: '2. Verifikasi',
      desc: 'Kelengkapan lampiran',
      count: stats?.verified || 0,
      icon: FileCheck,
      path: '/stage-2',
      color: 'border-blue-200 text-blue-700 bg-blue-50/50',
    },
    {
      id: 3,
      title: '3. Input Data',
      desc: 'Input nilai nominal DPP/PPN',
      count: stats?.data_inputted || 0,
      icon: FileSpreadsheet,
      path: '/stage-3',
      color: 'border-indigo-200 text-indigo-700 bg-indigo-50/50',
    },
    {
      id: 4,
      title: '4. Digitalisasi',
      desc: 'Pemindaian HP Flatbed',
      count: stats?.scanned || 0,
      icon: ScanLine,
      path: '/stage-4',
      color: 'border-purple-200 text-purple-700 bg-purple-50/50',
    },
    {
      id: 5,
      title: '5. Rekonsiliasi',
      desc: 'Pengecekan kesesuaian',
      count: stats?.reconciled || 0,
      icon: SplitSquareVertical,
      path: '/stage-5',
      color: 'border-emerald-200 text-emerald-700 bg-emerald-50/50',
    },
    {
      id: 6,
      title: '6. Boks & Gudang',
      desc: 'Packing kardus & warehouse',
      count: (stats?.boxed || 0) + (stats?.archived || 0),
      icon: Archive,
      path: '/stage-6',
      color: 'border-teal-200 text-teal-700 bg-teal-50/50',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard Alur Operasional</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelacakan siklus hidup invoice fisik dari penerimaan hingga pengarsipan gudang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchDashboardData} isLoading={isLoading}>
            Perbarui Data
          </Button>
          <Button variant="primary" size="sm" icon={FilePlus} onClick={() => navigate('/stage-1')}>
            + Terima Invoice Baru
          </Button>
        </div>
      </div>

      {/* 6-Stage Pipeline Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <Link
              key={stage.id}
              to={stage.path}
              className="bg-white border border-slate-200 hover:border-slate-900 rounded-lg p-4 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-md ${stage.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {stage.count}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-corporate-900 tracking-tight">
                  {stage.title}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{stage.desc}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500 group-hover:text-slate-900">
                <span>Buka Tahap</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Summary Highlights */}
        <Card title="Ringkasan Status Finansial" subtitle="Statistik antrean proses aktif">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Total Invoice Terdaftar</p>
                  <p className="text-[11px] text-slate-400">Semua riwayat dokumen di sistem</p>
                </div>
              </div>
              <span className="text-lg font-bold font-mono text-slate-900">
                {stats?.total_invoices || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-900">Rekonsiliasi Selesai</p>
                  <p className="text-[11px] text-emerald-600">Siap dikemas ke dalam boks</p>
                </div>
              </div>
              <span className="text-lg font-bold font-mono text-emerald-900">
                {stats?.reconciled || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-teal-50/50 rounded-lg border border-teal-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-teal-900">Tersimpan di Warehouse</p>
                  <p className="text-[11px] text-teal-600">Arsip fisik aman dengan nomor rak</p>
                </div>
              </div>
              <span className="text-lg font-bold font-mono text-teal-900">
                {stats?.archived || 0}
              </span>
            </div>

            {/* Peminjaman Dokumen Box */}
            <div className="pt-2 border-t border-slate-200">
              <Link
                to="/loans"
                className="flex items-center justify-between p-3 bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-200 rounded-lg transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    <FolderClock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-950 group-hover:text-indigo-900 flex items-center gap-1.5">
                      Peminjaman Dokumen (Luar)
                    </p>
                    <p className="text-[10px] text-indigo-700/80">
                      {loanStats?.overdue_loans ? (
                        <span className="text-rose-600 font-bold">
                          {loanStats.overdue_loans} Overdue &bull; {loanStats.active_loans} Aktif
                        </span>
                      ) : (
                        `${loanStats?.active_loans || 0} Berkas Aktif Dipinjam`
                      )}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Recent Invoices Table (Span 2) */}
        <div className="lg:col-span-2">
          <Card
            title="Antrean Invoice Terbaru"
            subtitle="Dokumen yang baru didaftarkan atau diupdate"
            action={
              <Link to="/invoices" className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {recent.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <FolderOpen className="w-10 h-10 text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold text-slate-700">Belum Ada Dokumen Invoice</p>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Mulai dengan mencatat tanda terima berkas fisik.</p>
                <Button size="sm" onClick={() => navigate('/stage-1')}>Input Invoice Sekarang</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Tracking Code</th>
                      <th className="px-3 py-2.5">Nama Vendor</th>
                      <th className="px-3 py-2.5">No. Invoice</th>
                      <th className="px-3 py-2.5 text-right">Total Nilai</th>
                      <th className="px-3 py-2.5">Status Alur</th>
                      <th className="px-3 py-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {recent.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-900">{inv.tracking_code}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">{inv.vendor_name}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">{inv.invoice_number || '-'}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-900">
                          {inv.total_amount > 0 ? formatCurrency(inv.total_amount, inv.currency) : '-'}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge status={inv.status} />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => {
                              // Direct to relevant stage
                              if (inv.status === 'received') navigate(`/stage-2?id=${inv.id}`);
                              else if (inv.status === 'verified') navigate(`/stage-3?id=${inv.id}`);
                              else if (inv.status === 'data_inputted') navigate(`/stage-4?id=${inv.id}`);
                              else if (inv.status === 'scanned') navigate(`/stage-5?id=${inv.id}`);
                              else if (inv.status === 'reconciled') navigate(`/stage-6`);
                              else navigate(`/invoices`);
                            }}
                            className="text-[11px] font-semibold text-corporate-900 hover:underline cursor-pointer"
                          >
                            Proses &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
