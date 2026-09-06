import React from 'react';
import { useAppStore } from '../../store/appStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const showToast = (message, type = 'info', duration = 4000) => {
  useAppStore.getState().addToast(message, type, duration);
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg shadow-lg border text-xs font-medium transition-all duration-300 animate-in slide-in-from-bottom-3 ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : isError
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : isWarning
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {isWarning && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
            {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />}

            <div className="flex-1 leading-relaxed">{toast.message}</div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
