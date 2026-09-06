import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { AppShell } from './components/layout/AppShell';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Stage1Receipt } from './pages/Stage1Receipt';
import { Stage2Verification } from './pages/Stage2Verification';
import { Stage3DataInput } from './pages/Stage3DataInput';
import { Stage4Scanning } from './pages/Stage4Scanning';
import { Stage5Reconciliation } from './pages/Stage5Reconciliation';
import { Stage6Warehouse } from './pages/Stage6Warehouse';
import { InvoiceList } from './pages/InvoiceList';
import { DocumentLoans } from './pages/DocumentLoans';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-white">Terjadi Kendala Tampilan UI</h2>
            <p className="text-xs text-slate-300">
              {this.state.error?.message || 'Gagal memuat komponen antarmuka.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = '#/';
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-semibold text-white transition"
              >
                Muat Ulang Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.hash = '#/login';
                  window.location.reload();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-semibold text-slate-200 transition"
              >
                Reset & Login Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { hasRole } = useAuthStore();
  if (!hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route
                path="stage-1"
                element={
                  <RoleProtectedRoute allowedRoles={['loger', 'admin']}>
                    <Stage1Receipt />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="stage-2"
                element={
                  <RoleProtectedRoute allowedRoles={['loger', 'admin']}>
                    <Stage2Verification />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="stage-3"
                element={
                  <RoleProtectedRoute allowedRoles={['fp', 'admin']}>
                    <Stage3DataInput />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="stage-4"
                element={
                  <RoleProtectedRoute allowedRoles={['loger', 'fp', 'admin']}>
                    <Stage4Scanning />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="stage-5"
                element={
                  <RoleProtectedRoute allowedRoles={['fp', 'admin']}>
                    <Stage5Reconciliation />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="stage-6"
                element={
                  <RoleProtectedRoute allowedRoles={['ware', 'admin']}>
                    <Stage6Warehouse />
                  </RoleProtectedRoute>
                }
              />
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="loans" element={<DocumentLoans />} />
              <Route
                path="settings"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <Settings />
                  </RoleProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
