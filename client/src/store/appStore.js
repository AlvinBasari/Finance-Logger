import { create } from 'zustand';

export const useAppStore = create((set, get) => {
  const isSimulatorSaved = localStorage.getItem('scanner_use_virtual') === 'true';

  return {
    scannerStatus: isSimulatorSaved ? {
      ready: true,
      mode: 'virtual',
      device: 'HP DeskJet 2132 (Virtual Simulator)',
      type: 'virtual_driver',
      isScanning: false,
      note: 'Mode simulator aktif untuk pengujian',
    } : {
      ready: false,
      mode: 'offline',
      device: 'Scanner Offline (Belum Terhubung)',
      type: 'offline',
      isScanning: false,
      note: 'Scanner fisik HP DeskJet 2132 belum terdeteksi',
    },
    syncStatus: 'online', // 'online' | 'syncing' | 'offline'
    toasts: [],
    isGlobalLoading: false,
    activeRequestsCount: 0,

    startGlobalLoading: () => {
      set((state) => {
        const newCount = state.activeRequestsCount + 1;
        return {
          activeRequestsCount: newCount,
          isGlobalLoading: newCount > 0,
        };
      });
    },

    stopGlobalLoading: () => {
      set((state) => {
        const newCount = Math.max(0, state.activeRequestsCount - 1);
        return {
          activeRequestsCount: newCount,
          isGlobalLoading: newCount > 0,
        };
      });
    },

    setScannerStatus: (status) => set((state) => ({ scannerStatus: { ...state.scannerStatus, ...status } })),
    setSyncStatus: (status) => set({ syncStatus: status }),

  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
};
});
