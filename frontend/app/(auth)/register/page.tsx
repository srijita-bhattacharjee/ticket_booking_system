'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { Mail, KeyRound, ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<'DETAILS' | 'VERIFY_OTP'>('DETAILS');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'ORGANISER' | 'ADMIN'>('CUSTOMER');
  const [otp, setOtp] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Send OTP to user's email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authService.sendSignupOtp({ name, email, password, role });
      setSuccessMsg(res.data.message);
      setStep('VERIFY_OTP');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP verification email');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify OTP code & complete account activation
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP verification code.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await authService.verifySignupOtp({ email, otp: otp.trim() });
      login(res.data.accessToken, res.data.user);
      
      if (role === 'ORGANISER') router.push('/organiser/dashboard');
      else if (role === 'ADMIN') router.push('/admin/venues');
      else router.push('/events');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend OTP trigger
  const handleResendOtp = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await authService.sendSignupOtp({ name, email, password, role });
      setSuccessMsg(`New OTP sent! ${res.data.message}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold theme-text-main">
          {step === 'DETAILS' ? 'Create Your Account' : 'Verify Email OTP'}
        </h1>
        <p className="text-xs theme-text-secondary">
          {step === 'DETAILS'
            ? 'Join as a Customer, Event Organiser, or Venue Admin'
            : `We sent a 6-digit verification code to ${email}`}
        </p>
      </div>

      {error && (
        <div className="bg-rose-950/80 border border-rose-600/60 p-3.5 rounded-xl text-rose-300 text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-600/60 p-3.5 rounded-xl text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: Registration Form Details */}
      {step === 'DETAILS' ? (
        <form onSubmit={handleSendOtp} className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-bold theme-text-main mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold theme-text-main mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold theme-text-main mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold theme-text-main mb-1">Select Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none focus:border-purple-500"
            >
              <option value="CUSTOMER">Customer (Book seats, view tickets)</option>
              <option value="ORGANISER">Organiser (Create events, view analytics)</option>
              <option value="ADMIN">Admin (Manage venues and layouts)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full theme-btn-primary font-extrabold py-3.5 rounded-xl transition text-xs shadow-lg flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span>{submitting ? 'Sending Verification OTP...' : 'Send Email Verification OTP'}</span>
          </button>

          <p className="text-center text-xs theme-text-secondary pt-2">
            Already registered?{' '}
            <Link href="/login" className="theme-text-accent font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </form>
      ) : (
        /* STEP 2: 6-Digit OTP Verification Screen */
        <form onSubmit={handleVerifyOtp} className="theme-bg-card theme-border border rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl theme-bg-elevated theme-border border mx-auto flex items-center justify-center text-purple-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <p className="text-xs theme-text-secondary">
              Enter the 6-digit OTP verification code sent to <strong className="theme-text-main">{email}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold theme-text-main mb-2 text-center uppercase tracking-wider">
              6-Digit OTP Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full theme-bg-input theme-border border rounded-xl p-4 text-center font-mono text-2xl tracking-[10px] font-black theme-text-accent focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full theme-btn-primary font-extrabold py-3.5 rounded-xl transition text-xs shadow-lg flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{submitting ? 'Verifying Code...' : 'Verify OTP & Activate Account'}</span>
          </button>

          <div className="flex items-center justify-between pt-2 border-t theme-border text-xs">
            <button
              type="button"
              onClick={() => setStep('DETAILS')}
              className="theme-text-secondary hover:theme-text-main flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to details
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={submitting}
              className="theme-text-accent hover:underline flex items-center gap-1 font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
