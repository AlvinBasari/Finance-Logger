import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

export const formatCurrency = (amount, currency = 'IDR') => {
  const num = parseFloat(amount) || 0;
  if (currency === 'IDR') {
    return 'Rp ' + num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return currency + ' ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatDate = (dateString, format = 'DD MMM YYYY') => {
  if (!dateString) return '-';
  return dayjs(dateString).format(format);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('DD MMM YYYY, HH:mm');
};

/**
 * Status mapping based on design.md Section 3.3
 */
export const getStatusConfig = (status) => {
  switch (status) {
    case 'received':
      return {
        label: 'Tahap 1: Diterima',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        dot: 'bg-slate-400',
        step: 1,
      };
    case 'verified':
      return {
        label: 'Tahap 2: Terverifikasi',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        step: 2,
      };
    case 'data_inputted':
      return {
        label: 'Tahap 3: Data Diinput',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        dot: 'bg-indigo-500',
        step: 3,
      };
    case 'scanned':
      return {
        label: 'Tahap 4: Terpindai',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        dot: 'bg-purple-500',
        step: 4,
      };
    case 'reconciled':
      return {
        label: 'Tahap 5: Rekonsiliasi',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        dot: 'bg-emerald-600',
        step: 5,
      };
    case 'boxed':
      return {
        label: 'Tahap 6: Masuk Boks',
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        dot: 'bg-teal-600',
        step: 6,
      };
    case 'archived':
      return {
        label: 'Tersimpan di Gudang',
        bg: 'bg-teal-100',
        text: 'text-teal-800',
        dot: 'bg-teal-700',
        step: 6,
      };
    case 'incomplete':
      return {
        label: 'Belum Lengkap',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        step: 2,
      };
    case 'rejected':
      return {
        label: 'Ditolak',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        dot: 'bg-rose-500',
        step: 2,
      };
    default:
      return {
        label: status || 'Unknown',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
        step: 0,
      };
  }
};

export const getBoxStatusConfig = (status) => {
  switch (status) {
    case 'open':
      return { label: 'Terbuka (Pengisian)', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' };
    case 'sealed':
      return { label: 'Disegel (Siap Kirim)', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
    case 'in_transit':
      return { label: 'Dalam Pengiriman', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' };
    case 'stored':
      return { label: 'Tersimpan di Gudang', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-600' };
    default:
      return { label: status, bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  }
};
