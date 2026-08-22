'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { UserCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await authService.login({ email, password });
      login(res.data.accessToken, res.data.user);
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (res.data.user.role === 'ORGANISER') {
        router.push('/organiser/dashboard');
      } else if (res.data.user.role === 'ADMIN') {
        router.push('/admin/venues');
      } else {
        router.push('/events');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const fillPreset = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Welcome Back</h1>
        <p className="text-xs text-slate-400">Log in to manage holds, bookings, and organiser dashboards</p>
      </div>

      {/* Quick Role Tester Preset Buttons */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
        <p className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4" /> Quick Demo Role Presets:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => fillPreset('john@example.com')}
            className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-[11px] font-semibold text-slate-200 text-center border border-slate-700 transition"
          >
            Customer
          </button>
          <button
            onClick={() => fillPreset('organiser@apexevents.com')}
            className="bg-purple-900/60 hover:bg-purple-900 p-2 rounded-xl text-[11px] font-semibold text-purple-300 text-center border border-purple-700 transition"
          >
            Organiser
          </button>
          <button
            onClick={() => fillPreset('admin@ticketbooking.com')}
            className="bg-amber-900/60 hover:bg-amber-900 p-2 rounded-xl text-[11px] font-semibold text-amber-300 text-center border border-amber-700 transition"
          >
            Admin
          </button>
        </div>
      </div>

      {error && <div className="bg-rose-950/80 border border-rose-600/60 p-3.5 rounded-xl text-rose-300 text-xs font-semibold text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold py-3 rounded-xl transition text-sm shadow-lg shadow-sky-500/20"
        >
          {submitting ? 'Authenticating...' : 'Sign In'}
        </button>

        <p className="text-center text-xs text-slate-400 pt-2">
          Don't have an account?{' '}
          <Link href="/register" className="text-sky-400 font-bold hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-500 text-xs">Loading authentication page...</div>}>
      <LoginForm />
    </Suspense>
  );
}
