import { create } from 'zustand';
import { authApi } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
  token: localStorage.getItem('auth_token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      const { token, user } = response.data.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      set({ user, token, isLoading: false, error: null });
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Login gagal. Periksa koneksi atau kredensial.';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      if (get().token) {
        await authApi.logout();
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({ user: null, token: null });
    }
  },

  hasRole: (roleOrRoles) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'admin') return true;

    // Normalization mapping
    const normalizeRole = (r) => {
      if (r === 'logger') return 'loger';
      if (r === 'supervisor') return 'fp';
      if (r === 'warehouse') return 'ware';
      return r;
    };

    const userNormalized = normalizeRole(user.role);
    const targets = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    const normalizedTargets = targets.map(normalizeRole);

    return normalizedTargets.includes(userNormalized) || normalizedTargets.includes('all');
  },
}));
