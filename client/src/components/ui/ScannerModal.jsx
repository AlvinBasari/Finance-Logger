import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAppStore } from '../../store/appStore';
import {
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Usb,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';

export const ScannerModal = ({ isOpen, onClose }) => {
  const { scannerStatus, setScannerStatus, addToast } = useAppStore();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState(null);

  const handleTestConnection = async (forceSimulator = false) => {
    setIsChecking(true);
    setLastCheckMessage(null);
    try {
      if (window.scannerAPI?.checkScanner) {
        const res = await window.scannerAPI.checkScanner({ forceSimulator });
        setScannerStatus(res);

        if (forceSimulator) {
          localStorage.setItem('scanner_use_virtual', 'true');
          setLastCheckMessage({
            type: 'warning',
            text: 'Mode Simulator Virtual aktif. Anda dapat memindai dokumen pengujian tanpa scanner fisik.',
          });
          addToast('Mode simulator scanner aktif', 'info');
        } else if (res.ready) {
          localStorage.removeItem('scanner_use_virtual');
          setLastCheckMessage({
            type: 'success',
            text: `Perangkat fisik terdeteksi: ${res.device}. Siap memindai dari kaca flatbed HP DeskJet.`,
          });
          addToast('Scanner fisik berhasil terhubung!', 'success');
        } else {
          localStorage.removeItem('scanner_use_virtual');
          setLastCheckMessage({
            type: 'error',
            text: res.error || 'Scanner fisik HP DeskJet 2132 belum terdeteksi di Windows.',
          });
          addToast('Scanner fisik belum terhubung', 'warning');
        }
      } else {
        // Browser environment fallback
        if (forceSimulator) {
          const sim = {
            ready: true,
            mode: 'virtual',
            type: 'virtual_driver',
            device: 'HP DeskJet 2132 (Virtual Simulator Active)',
            note: 'Driver simulator browser aktif.',
          };
          localStorage.setItem('scanner_use_virtual', 'true');
          setScannerStatus(sim);
          setLastCheckMessage({
            type: 'warning',
            text: 'Mode Simulator Virtual aktif untuk pengujian.',
          });
        } else {
          const off = {
            ready: false,
            mode: 'offline',
            type: 'offline',
            device: 'Scanner Offline',
            error: 'Buka melalui aplikasi desktop untuk menghubungkan driver hardware WIA.',
          };
          localStorage.removeItem('scanner_use_virtual');
          setScannerStatus(off);
          setLastCheckMessage({
            type: 'error',
            text: 'Scanner fisik tidak terhubung.',
          });
        }
      }
    } catch (err) {
      setLastCheckMessage({
        type: 'error',
        text: 'Gagal mendiagnostik scanner: ' + err.message,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggleSimulator = () => {
    const isCurrentlyVirtual = scannerStatus.mode === 'virtual' || localStorage.getItem('scanner_use_virtual') === 'true';
    if (isCurrentlyVirtual) {
      handleTestConnection(false);
    } else {
      handleTestConnection(true);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Status & Diagnostik Scanner Flatbed"
      subtitle="Integrasi Driver Hardware HP DeskJet 2132 (WIA Engine)"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 text-xs text-slate-700 font-sans">
        {/* Current Connection Status Box */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
            scannerStatus.ready
              ? scannerStatus.mode === 'virtual'
                ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : 'bg-rose-50/70 border-rose-300 text-rose-950'
          }`}
        >
          <div
            className={`p-2.5 rounded-lg shrink-0 ${
              scannerStatus.ready
                ? scannerStatus.mode === 'virtual'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            <Printer className="w-6 h-6" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">
                {scannerStatus.ready
                  ? scannerStatus.mode === 'virtual'
                    ? 'Mode Simulator Virtual (Aktif)'
                    : 'Scanner Fisik Terhubung'
                  : 'Scanner Tidak Terhubung (Offline)'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  scannerStatus.ready
                    ? scannerStatus.mode === 'virtual'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                    : 'bg-rose-200 text-rose-900'
                }`}
              >
                {scannerStatus.mode || 'offline'}
              </span>
            </div>
            <p className="text-[11px] opacity-90 font-mono">
              Perangkat: {scannerStatus.device || 'HP DeskJet 2130 Series'}
            </p>
            <p className="text-[11px] opacity-80">
              {scannerStatus.note || scannerStatus.error || 'Driver WIA flatbed kaca siap memindai berkas invoice.'}
            </p>
          </div>
        </div>

        {/* Diagnostic Feedback Alert if freshly tested */}
        {lastCheckMessage && (
          <div
            className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
              lastCheckMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : lastCheckMessage.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {lastCheckMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{lastCheckMessage.text}</p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Button
            variant="primary"
            icon={RefreshCw}
            onClick={() => handleTestConnection(false)}
            isLoading={isChecking}
            className="w-full justify-center"
          >
            Uji Sambungan USB Fisik
          </Button>

          <Button
            variant={scannerStatus.mode === 'virtual' ? 'secondary' : 'outline'}
            icon={Cpu}
            onClick={handleToggleSimulator}
            isLoading={isChecking}
            className="w-full justify-center"
          >
            {scannerStatus.mode === 'virtual' ? 'Matikan Mode Simulator' : 'Aktifkan Simulator Virtual'}
          </Button>
        </div>

        {/* Hardware Troubleshooting Guide */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
            <Usb className="w-4 h-4 text-indigo-600" />
            <span>Petunjuk Sambungan Hardware HP DeskJet 2132:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600 leading-relaxed">
            <li>Pastikan kabel USB printer tercolok kencang ke komputer/laptop.</li>
            <li>Pastikan lampu tombol power pada HP DeskJet menyala stabil.</li>
            <li>Buka penutup atas scanner, letakkan invoice di atas kaca flatbed sudut kanan bawah.</li>
            <li>Jika sedang tidak berada di dekat scanner fisik, klik <b>"Aktifkan Simulator Virtual"</b> agar Anda tetap dapat mencoba seluruh proses scan & pengarsipan.</li>
          </ul>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
};
