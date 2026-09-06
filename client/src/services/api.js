import axios from 'axios';

const savedUrl = localStorage.getItem('api_base_url');
const API_BASE_URL = (savedUrl && !savedUrl.includes(':8000')) ? savedUrl : 'http://127.0.0.1:8088/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
  timeout: 30000,
});

import { useAppStore } from '../store/appStore';

// Request Interceptor: Attach Bearer token and trigger global loader
api.interceptors.request.use((config) => {
  useAppStore.getState().startGlobalLoading();
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  useAppStore.getState().stopGlobalLoading();
  return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized and stop loader
api.interceptors.response.use(
  (response) => {
    useAppStore.getState().stopGlobalLoading();
    return response;
  },
  (error) => {
    useAppStore.getState().stopGlobalLoading();
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      if (!window.location.hash.includes('/login')) {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export const updateBaseUrl = (newUrl) => {
  localStorage.setItem('api_base_url', newUrl);
  api.defaults.baseURL = newUrl;
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const invoiceApi = {
  getStats: () => api.get('/dashboard/stats'),
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  createReceipt: (data) => {
    if (data instanceof FormData) {
      return api.post('/invoices', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/invoices', data);
  },
  checkDuplicate: (params) => api.get('/invoices/check-duplicate', { params }),
  verifyChecklist: (id, data) => api.put(`/invoices/${id}/verify`, data),
  updateFinancials: (id, data) => api.put(`/invoices/${id}/financials`, data),
  uploadScan: (formData) => api.post('/invoices/upload-scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  finalizeSoftfile: (id) => api.put(`/invoices/${id}/finalize-softfile`),
  reconcile: (id, data) => api.put(`/invoices/${id}/reconcile`, data),
};

export const boxApi = {
  getAll: (params) => api.get('/boxes', { params }),
  getById: (id) => api.get(`/boxes/${id}`),
  create: (data) => api.post('/boxes', data),
  addInvoice: (boxId, data) => api.post(`/boxes/${boxId}/add-invoice`, data),
  removeInvoice: (boxId, invoiceId) => api.delete(`/boxes/${boxId}/remove-invoice/${invoiceId}`),
  seal: (boxId) => api.put(`/boxes/${boxId}/seal`),
  receive: (boxId, data) => api.put(`/boxes/${boxId}/receive`, data),
};

export const loanApi = {
  getAll: (params) => api.get('/loans', { params }),
  getById: (id) => api.get(`/loans/${id}`),
  getStats: () => api.get('/loans/stats'),
  create: (data) => api.post('/loans', data),
  returnItems: (id, data) => api.put(`/loans/${id}/return`, data),
  sendReminder: (id) => api.post(`/loans/${id}/send-reminder`),
};

export default api;
