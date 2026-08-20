'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'ORGANISER' | 'ADMIN'>('CUSTOMER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await authService.register({ name, email, password, role });
      login(res.data.accessToken, res.data.user);
      if (role === 'ORGANISER') router.push('/organiser/dashboard');
      else if (role === 'ADMIN') router.push('/admin/venues');
      else router.push('/events');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Create Your Account</h1>
        <p className="text-xs text-slate-400">Join as a Customer, Event Organiser, or Venue Admin</p>
      </div>

      {error && <div className="bg-rose-950/80 border border-rose-600/60 p-3.5 rounded-xl text-rose-300 text-xs font-semibold text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Select Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="CUSTOMER">Customer (Book seats, view tickets)</option>
            <option value="ORGANISER">Organiser (Create events, view analytics)</option>
            <option value="ADMIN">Admin (Manage venues and layouts)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold py-3 rounded-xl transition text-sm shadow-lg shadow-sky-500/20"
        >
          {submitting ? 'Creating Account...' : 'Register Account'}
        </button>

        <p className="text-center text-xs text-slate-400 pt-2">
          Already registered?{' '}
          <Link href="/login" className="text-sky-400 font-bold hover:underline">
            Log in here
          </Link>
        </p>
      </form>
    </div>
  );
}
