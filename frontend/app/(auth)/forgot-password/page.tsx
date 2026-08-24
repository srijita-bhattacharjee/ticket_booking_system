'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../../services/api';
import { KeyRound, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Flow control state: 'REQUEST' | 'RESET'
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');

  // Input states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authService.forgotPassword(email);
      setSuccessMsg(res.data.message || 'If registered, a password reset code has been sent.');
      setStep('RESET');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send password reset code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Reset Password using OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setSubmitting(false);
      return;
    }

    try {
      await authService.resetPassword({
        email,
        otp: otp.trim(),
        newPassword,
      });

      setSuccessMsg('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset failed. Invalid or expired OTP code.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="bg-sky-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-sky-400 border border-sky-500/20">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Reset Password</h1>
        <p className="text-xs text-slate-400">
          {step === 'REQUEST'
            ? 'Enter your email address and we will send you a 6-digit OTP code to verify your identity.'
            : 'Enter the verification OTP code and your new secure account password.'}
        </p>
      </div>

      {error && (
        <div className="bg-rose-950/80 border border-rose-600/60 p-3.5 rounded-xl text-rose-300 text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-600/60 p-3.5 rounded-xl text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {step === 'REQUEST' ? (
        // FORM: Step 1 Request
        <form onSubmit={handleRequestOtp} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold py-3 rounded-xl transition text-sm shadow-lg shadow-sky-500/20 disabled:opacity-50"
          >
            {submitting ? 'Sending verification...' : 'Send OTP Code'}
          </button>

          <div className="flex justify-between items-center pt-2">
            <Link href="/login" className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      ) : (
        // FORM: Step 2 Reset
        <form onSubmit={handleResetPassword} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Verification OTP</label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-lg tracking-[8px] font-mono text-amber-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl transition text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {submitting ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep('REQUEST')}
              className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Re-request OTP code
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
