import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Activity, ShieldCheck, Stethoscope, User, UserCheck, DollarSign } from 'lucide-react';
import { UserRole } from '../../types';

export const Login: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setError(null);
    setIsLoading(true);
    try {
      await switchDemoRole(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-brand-600 text-white items-center justify-center mb-3 shadow-md shadow-brand-500/20">
            <Activity className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Smart Hospital Platform</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in to access your role-based clinical dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. patient@hospital.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-900 bg-white"
            />
          </div>

          <Button type="submit" className="w-full py-2.5" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        {/* 1-Click Role Quick Login for Instant Evaluation */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Instant Demo Logins (1-Click)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin(UserRole.PATIENT)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-medium transition-colors"
            >
              <User className="w-4 h-4 text-sky-600" />
              <span>Patient</span>
            </button>

            <button
              onClick={() => handleQuickLogin(UserRole.DOCTOR)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-medium transition-colors"
            >
              <Stethoscope className="w-4 h-4 text-cyan-600" />
              <span>Doctor</span>
            </button>

            <button
              onClick={() => handleQuickLogin(UserRole.HOSPITAL_ADMIN)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-medium transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Hospital Admin</span>
            </button>

            <button
              onClick={() => handleQuickLogin(UserRole.RECEPTIONIST)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-medium transition-colors"
            >
              <UserCheck className="w-4 h-4 text-orange-600" />
              <span>Receptionist</span>
            </button>

            <button
              onClick={() => handleQuickLogin(UserRole.ACCOUNTANT)}
              className="col-span-2 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition-colors"
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Accountant (Billing & Ledger)</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Register as Patient
          </Link>
        </div>
      </div>
    </div>
  );
};
