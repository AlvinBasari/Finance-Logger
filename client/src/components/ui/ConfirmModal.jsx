import React, { useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'primary', // 'primary' | 'danger' | 'warning' | 'success'
  isLoading = false,
  icon: CustomIcon,
}) => {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const getIcon = () => {
    if (CustomIcon) return <CustomIcon className="w-6 h-6" />;
    switch (variant) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      default:
        return <HelpCircle className="w-6 h-6 text-indigo-600" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 border-rose-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-indigo-50 border-indigo-200';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      maxWidth="max-w-md"
      showClose={!isLoading}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full border shrink-0 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div className="text-xs text-slate-600 leading-relaxed pt-1">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmBtnRef}
            type="button"
            variant={variant === 'warning' ? 'primary' : variant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
