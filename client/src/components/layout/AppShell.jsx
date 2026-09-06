import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { ToastContainer } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { TopProgressBar } from '../ui/TopProgressBar';
import { ScannerModal } from '../ui/ScannerModal';
import {
  LayoutDashboard,
  FileCheck,
  FileSpreadsheet,
  ScanLine,
  SplitSquareVertical,
  Archive,
  ListOrdered,
  Settings as SettingsIcon,
  LogOut,
  Minus,
  Square,
  X,
  Printer,
  Wifi,
  WifiOff,
  UserCheck,
  FilePlus,
  FolderClock,
} from 'lucide-react';

export const AppShell = () => {
  const { user, logout } = useAuthStore();
  const { scannerStatus, setScannerStatus, syncStatus } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const initScanner = async () => {
      const isSimulatorSaved = localStorage.getItem('scanner_use_virtual') === 'true';
      if (window.scannerAPI?.checkScanner) {
        try {
          const res = await window.scannerAPI.checkScanner({ forceSimulator: isSimulatorSaved });
          setScannerStatus(res);
        } catch (e) {
          console.warn('Auto scanner check error:', e);
        }
      }
    };
    initScanner();
  }, []);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = async () => {
    const max = await window.electronAPI?.maximizeWindow();
    setIsMaximized(!!max);
  };
  const handleClose = () => window.electronAPI?.closeWindow();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login');
  };

  const { hasRole } = useAuthStore();

  const mainItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true, roles: ['loger', 'fp', 'ware', 'admin'] },
  ];

  const stageItems = [
    { to: '/stage-1', label: '1. Penerimaan Berkas', icon: FilePlus, roles: ['loger', 'admin'] },
    { to: '/stage-2', label: '2. Verifikasi Fisik', icon: FileCheck, roles: ['loger', 'admin'] },
    { to: '/stage-3', label: '3. Input Finansial', icon: FileSpreadsheet, roles: ['fp', 'admin'] },
    { to: '/stage-4', label: '4. Digitalisasi Scan', icon: ScanLine, roles: ['loger', 'fp', 'admin'] },
    { to: '/stage-5', label: '5. Rekonsiliasi', icon: SplitSquareVertical, roles: ['fp', 'admin'] },
    { to: '/stage-6', label: '6. Boks & Warehouse', icon: Archive, roles: ['ware', 'admin'] },
  ];

  const secondaryItems = [
    { to: '/invoices', label: 'Daftar Semua Invoice', icon: ListOrdered, roles: ['loger', 'fp', 'ware', 'admin'] },
    { to: '/loans', label: 'Peminjaman Arsip', icon: FolderClock, roles: ['loger', 'fp', 'ware', 'admin'] },
    { to: '/settings', label: 'Pengaturan & Alat', icon: SettingsIcon, roles: ['admin'] },
  ];

  const allowedMainItems = mainItems.filter((item) => hasRole(item.roles));
  const allowedStageItems = stageItems.filter((item) => hasRole(item.roles));
  const allowedSecondaryItems = secondaryItems.filter((item) => hasRole(item.roles));
  const allAllowedNavItems = [...allowedMainItems, ...allowedStageItems, ...allowedSecondaryItems];

  return (
    <div className="flex flex-col h-screen w-screen bg-corporate-50 overflow-hidden font-sans select-none">
      {/* 1. Custom Titlebar for Desktop Window */}
      <header className="h-8 bg-corporate-900 text-slate-300 flex items-center justify-between px-3 text-xs shrink-0 select-none titlebar-drag-region z-50">
        <div className="flex items-center gap-2 font-medium">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-white tracking-wide">Sistem Logger & Pengarsipan Invoice</span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">v1.1.0 (Flatbed HP)</span>
        </div>

        <div className="flex items-center gap-1 titlebar-no-drag">
          <button
            onClick={handleMinimize}
            className="w-7 h-6 flex items-center justify-center hover:bg-slate-700 rounded transition text-slate-300 hover:text-white"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-6 flex items-center justify-center hover:bg-slate-700 rounded transition text-slate-300 hover:text-white"
            title="Maximize"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-6 flex items-center justify-center hover:bg-rose-600 rounded transition text-slate-300 hover:text-white"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Main Desktop Shell */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Fixed Sidebar (240px) */}
        <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-corporate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              FL
            </div>
            <div>
              <h1 className="text-xs font-bold text-corporate-900 tracking-tight leading-none">FINANCE LOGGER</h1>
              <p className="text-[10px] text-slate-500 mt-0.5">Physical to Digital System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* Dashboard / Main Items */}
            {allowedMainItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition mb-2 ${
                    isActive
                      ? 'bg-corporate-900 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-corporate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}

            {/* Operational Stages */}
            {allowedStageItems.length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tahapan Operasional
                </div>

                {allowedStageItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition ${
                        isActive
                          ? 'bg-corporate-900 text-white shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-corporate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </>
            )}

            {/* Secondary / General Items */}
            {allowedSecondaryItems.length > 0 && (
              <>
                <div className="pt-3 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Data & Pengaturan
                </div>

                {allowedSecondaryItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition ${
                        isActive
                          ? 'bg-corporate-900 text-white shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-corporate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* User Profile Bar at Sidebar Bottom */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{user?.name}</p>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block capitalize">
                  {user?.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Right Main Container */}
        <div className="flex-1 flex flex-col overflow-hidden bg-corporate-50">
          {/* Top Status Header (h-14, 56px) */}
          <header className="h-14 bg-white/90 backdrop-blur-xs border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
            {/* Stage Progress Indicator or Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span className="text-slate-400">Lokasi:</span>
              <span className="font-semibold text-corporate-900">
                {allAllowedNavItems.find((n) => n.to === location.pathname)?.label || 'Aplikasi Invoice'}
              </span>
            </div>

            {/* Hardware & Cloud Sync Indicators */}
            <div className="flex items-center gap-4">
              {/* Interactive Scanner Status Button */}
              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer shadow-2xs ${
                  scannerStatus.ready
                    ? scannerStatus.mode === 'virtual'
                      ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                }`}
                title="Klik untuk Diagnostik & Tes Sambungan Scanner"
              >
                <Printer
                  className={`w-3.5 h-3.5 ${
                    scannerStatus.ready
                      ? scannerStatus.mode === 'virtual'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                />
                <span className="text-[11px] font-mono font-medium">
                  {scannerStatus.ready
                    ? scannerStatus.mode === 'virtual'
                      ? 'Simulator Virtual'
                      : 'HP Flatbed (Ready)'
                    : 'Scanner Offline'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    scannerStatus.ready
                      ? scannerStatus.mode === 'virtual'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                      : 'bg-rose-500 animate-pulse'
                  }`}
                />
              </button>

              {/* cPanel Sync Status */}
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700 border border-slate-200">
                {syncStatus === 'online' ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span className="text-[11px] font-mono">
                  {syncStatus === 'online' ? 'API Connected' : 'Koneksi Terputus'}
                </span>
                <span className={`w-2 h-2 rounded-full ${syncStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              </div>
            </div>
          </header>

          {/* Main Content Viewport */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Top Animated Progress Bar */}
      <TopProgressBar />

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Scanner Diagnostic Modal */}
      <ScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Konfirmasi Keluar Aplikasi"
        message="Apakah Anda yakin ingin keluar dari sesi aplikasi desktop ini? Anda perlu memasukkan kredensial lagi untuk masuk."
        confirmText="Keluar"
        cancelText="Tetap di Sini"
        variant="danger"
      />
    </div>
  );
};
