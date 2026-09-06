import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Lock, Mail, Shield, CheckCircle, User } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('loger@finance.local');
  const [password, setPassword] = useState('password123');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    }
  };

  const setPresetUser = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100 font-sans select-none relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-corporate-900 border border-slate-700 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-3 shadow-md">
            FL
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Sistem Logger & Pengarsipan Invoice</h1>
          <p className="text-xs text-slate-400 mt-1">Finance Desktop Application • v1.1.0</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8 text-slate-900 border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-1">Masuk ke Akun Anda</h2>
          <p className="text-xs text-slate-500 mb-6">Gunakan kredensial internal divisi Finance & Warehouse</p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@finance.local"
              required
            />

            <Input
              label="Kata Sandi"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Masuk ke Aplikasi
            </Button>
          </form>

          {/* Quick Preset Selector for Easy Role Testing */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Pilihan Cepat Hak Akses Role:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPresetUser('loger@finance.local')}
                className={`p-2 rounded border text-left transition flex flex-col ${
                  email === 'loger@finance.local' || email === 'logger@finance.local'
                    ? 'border-slate-900 bg-slate-50 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px]">Loger</span>
                  <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">Berkas, Verif, Scan</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate mt-0.5">loger@finance.local</span>
              </button>

              <button
                type="button"
                onClick={() => setPresetUser('fp@finance.local')}
                className={`p-2 rounded border text-left transition flex flex-col ${
                  email === 'fp@finance.local' || email === 'supervisor@finance.local'
                    ? 'border-slate-900 bg-slate-50 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px]">FP (Finance)</span>
                  <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">Angka, Digital, Rekon</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate mt-0.5">fp@finance.local</span>
              </button>

              <button
                type="button"
                onClick={() => setPresetUser('ware@finance.local')}
                className={`p-2 rounded border text-left transition flex flex-col ${
                  email === 'ware@finance.local' || email === 'warehouse@finance.local'
                    ? 'border-slate-900 bg-slate-50 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px]">Ware (Gudang)</span>
                  <span className="text-[9px] px-1 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">Warehouse</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate mt-0.5">ware@finance.local</span>
              </button>

              <button
                type="button"
                onClick={() => setPresetUser('admin@finance.local')}
                className={`p-2 rounded border text-left transition flex flex-col ${
                  email === 'admin@finance.local'
                    ? 'border-slate-900 bg-slate-50 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px]">Admin</span>
                  <span className="text-[9px] px-1 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">All Akses</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate mt-0.5">admin@finance.local</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-[11px] mt-6">
          © 2026 Finance & Accounting Division • Terhubung ke HP DeskJet 2132 Series
        </p>
      </div>
    </div>
  );
};
