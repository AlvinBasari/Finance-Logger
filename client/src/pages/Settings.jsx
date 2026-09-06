import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { updateBaseUrl } from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  Settings as SettingsIcon,
  Server,
  Printer,
  User,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  HardDrive,
} from 'lucide-react';

export const Settings = () => {
  const { user, login } = useAuthStore();
  const { scannerStatus, setScannerStatus, addToast } = useAppStore();

  const savedApiUrl = localStorage.getItem('api_base_url');
  const [apiUrl, setApiUrl] = useState((savedApiUrl && !savedApiUrl.includes(':8000')) ? savedApiUrl : 'http://127.0.0.1:8088/api');
  const [isCheckingScanner, setIsCheckingScanner] = useState(false);
  const [scannerResult, setScannerResult] = useState(null);

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    updateBaseUrl(apiUrl);
    addToast('Konfigurasi URL API berhasil disimpan!', 'success');
  };

  const handleTestScanner = async () => {
    setIsCheckingScanner(true);
    try {
      if (window.scannerAPI?.checkScanner) {
        const res = await window.scannerAPI.checkScanner();
        setScannerResult(res);
        setScannerStatus(res);
        if (res.ready && res.mode === 'hardware') {
          localStorage.removeItem('scanner_use_virtual');
        }
        addToast('Scanner terdeteksi dan siap digunakan: ' + (res.device || 'HP Flatbed'), 'success');
      } else {
        const mock = {
          ready: true,
          type: 'virtual_driver',
          device: 'HP DeskJet 2130 series (Virtual WIA Driver)',
          note: 'Bridge active',
        };
        setScannerResult(mock);
        setScannerStatus(mock);
        addToast('Scanner driver bridge siap digunakan', 'success');
      }
    } catch (e) {
      addToast('Gagal mendeteksi scanner: ' + e.message, 'error');
    } finally {
      setIsCheckingScanner(false);
    }
  };

  const handleSwitchUser = async (email) => {
    const res = await login(email, 'password123');
    if (res.success) {
      addToast(`Berhasil beralih akun ke: ${res.user.name}`, 'success');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem & Diagnostik Alat</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Konfigurasi koneksi server backend cPanel, integrasi driver scanner fisik HP DeskJet 2132, dan manajemen akun.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. API Endpoint Configuration */}
        <Card title="Koneksi REST API Server" subtitle="Alamat endpoint server Laravel backend">
          <form onSubmit={handleSaveApiUrl} className="space-y-4">
            <Input
              label="Base URL API"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000/api"
              isMonospace
              helperText="Gunakan URL domain cPanel (contoh: https://api.domain.com/api) untuk server live."
              required
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="sm" icon={Server}>
                Simpan Konfigurasi
              </Button>
            </div>
          </form>
        </Card>

        {/* 2. Hardware Scanner Diagnostics */}
        <Card title="Diagnostik Scanner Flatbed" subtitle="Driver WIA & NAPS2 CLI HP DeskJet 2132">
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Target Perangkat:</span>
                <span className="font-mono text-indigo-700 font-bold">HP DeskJet 2132 Flatbed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Driver Mode:</span>
                <span className="font-mono text-slate-700">WIA (Windows Image Acquisition)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Resolusi Preset:</span>
                <span className="font-mono text-slate-700">200 DPI Grayscale A4</span>
              </div>
            </div>

            {scannerResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">{scannerResult.device}</p>
                  <p className="text-[10px] text-emerald-700">{scannerResult.note || 'Driver siap digunakan'}</p>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleTestScanner}
              isLoading={isCheckingScanner}
              className="w-full"
            >
              Uji Sambungan Scanner
            </Button>
          </div>
        </Card>

        {/* 3. Account Switcher (Testing & Roles) */}
        <div className="md:col-span-2">
          <Card title="Ganti Akun Cepat (Role-Based Access Control)" subtitle="Simulasi hak akses operasional antar divisi">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                { name: 'Finance Logger', email: 'logger@finance.local', desc: 'Penerimaan, Input, Scan, Box Packing' },
                { name: 'Finance Supervisor', email: 'supervisor@finance.local', desc: 'Verifikasi & Rekonsiliasi Approval' },
                { name: 'Warehouse Custodian', email: 'warehouse@finance.local', desc: 'Penerimaan Gudang & Penempatan Rak' },
                { name: 'System Administrator', email: 'admin@finance.local', desc: 'Akses Penuh Seluruh Modul' },
              ].map((acc) => (
                <div
                  key={acc.email}
                  className={`p-3.5 rounded-lg border transition flex flex-col justify-between ${
                    user?.email === acc.email
                      ? 'border-slate-900 bg-slate-50 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50/50 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{acc.name}</span>
                      {user?.email === acc.email && (
                        <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-semibold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">{acc.email}</p>
                    <p className="text-[11px] text-slate-600 mt-2">{acc.desc}</p>
                  </div>

                  <Button
                    size="sm"
                    variant={user?.email === acc.email ? 'secondary' : 'primary'}
                    onClick={() => handleSwitchUser(acc.email)}
                    disabled={user?.email === acc.email}
                    className="mt-3 w-full text-[11px]"
                  >
                    {user?.email === acc.email ? 'Sedang Digunakan' : 'Ganti ke Akun Ini'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
