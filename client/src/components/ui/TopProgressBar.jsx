import React from 'react';
import { useAppStore } from '../../store/appStore';
import { Loader2 } from 'lucide-react';

export const TopProgressBar = () => {
  const { isGlobalLoading } = useAppStore();

  if (!isGlobalLoading) return null;

  return (
    <>
      {/* 1. Top Glowing Animated Progress Bar */}
      <div className="fixed top-8 left-0 right-0 h-[3.5px] z-[9999] overflow-hidden bg-slate-200/60 pointer-events-none">
        <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-600 animate-loading-bar" />
      </div>

      {/* 2. High-Visibility Center Floating Glassmorphic Indicator */}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/25 backdrop-blur-[2px] pointer-events-auto transition-all">
        <div className="bg-slate-900/95 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-750 flex items-center gap-4 scale-100 transition-transform">
          <div className="relative flex items-center justify-center p-2 rounded-xl bg-slate-800 border border-slate-700">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold tracking-wide text-white flex items-center gap-2">
              <span>Memproses Data...</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[11px] text-slate-300 font-mono">
              Mohon tunggu sebentar, sedang sinkronisasi dengan server
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
