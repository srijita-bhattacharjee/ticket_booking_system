'use client';

import { useState } from 'react';
import { CreditCard, Lock, ShieldCheck, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StripePaymentModalProps {
  totalAmount: number;
  onPaymentSuccess: () => void;
  isProcessing: boolean;
}

export default function StripePaymentModal({
  totalAmount,
  onPaymentSuccess,
  isProcessing,
}: StripePaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [cardHolder, setCardHolder] = useState('Srijita Bhattacharjee');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'apple' | 'upi'>('card');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPaymentSuccess();
  };

  return (
    <div className="theme-bg-card theme-border border-2 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b theme-border pb-4">
        <div>
          <span className="text-[10px] font-mono font-black uppercase tracking-widest theme-text-accent flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> 256-BIT SSL ENCRYPTED GATEWAY
          </span>
          <h3 className="text-xl font-black theme-text-main mt-0.5">Stripe Payment Gateway</h3>
        </div>
        <div className="flex items-center gap-1.5 theme-bg-elevated px-3 py-1 rounded-full theme-border border text-[11px] font-mono font-bold theme-text-success">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>PCI-DSS Level 1</span>
        </div>
      </div>

      {/* Payment Method Selector Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 theme-bg-elevated rounded-2xl theme-border border">
        <button
          type="button"
          onClick={() => setSelectedMethod('card')}
          className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
            selectedMethod === 'card'
              ? 'theme-btn-primary shadow-md'
              : 'theme-text-secondary hover:theme-text-main'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Credit Card</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedMethod('apple')}
          className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
            selectedMethod === 'apple'
              ? 'theme-btn-primary shadow-md'
              : 'theme-text-secondary hover:theme-text-main'
          }`}
        >
          <span> Pay</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedMethod('upi')}
          className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
            selectedMethod === 'upi'
              ? 'theme-btn-primary shadow-md'
              : 'theme-text-secondary hover:theme-text-main'
          }`}
        >
          <span>⚡ Instant UPI</span>
        </button>
      </div>

      {/* Test Card Instructions Helper Badge */}
      <div className="p-3.5 rounded-2xl theme-bg-elevated theme-border border space-y-1">
        <div className="flex items-center justify-between text-xs font-mono font-extrabold theme-text-accent">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> STRIPE TEST MODE ACTIVE
          </span>
          <span className="theme-text-success">Auto-Fill Ready</span>
        </div>
        <p className="text-[11px] theme-text-secondary">
          Use test card <code className="theme-text-accent font-mono font-bold px-1 py-0.5 rounded bg-black/40 border border-amber-500/30">4242 4242 4242 4242</code> with any future expiry date and 3-digit CVC.
        </p>
      </div>

      {/* Card Input Form */}
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Cardholder Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono font-bold theme-text-secondary uppercase">Cardholder Name</label>
          <input
            type="text"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl theme-bg-elevated theme-border border text-xs font-mono theme-text-main focus:outline-none focus:border-theme-accent"
          />
        </div>

        {/* Card Number */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono font-bold theme-text-secondary uppercase">Card Number</label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
              className="w-full px-4 py-3 pr-12 rounded-xl theme-bg-elevated theme-border border text-xs font-mono theme-text-main focus:outline-none focus:border-theme-accent"
            />
            <CreditCard className="w-5 h-5 absolute right-3.5 top-3 theme-text-accent" />
          </div>
        </div>

        {/* Expiry & CVC Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold theme-text-secondary uppercase">Expiration (MM/YY)</label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl theme-bg-elevated theme-border border text-xs font-mono theme-text-main focus:outline-none focus:border-theme-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold theme-text-secondary uppercase">Security Code (CVC)</label>
            <input
              type="password"
              maxLength={4}
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl theme-bg-elevated theme-border border text-xs font-mono theme-text-main focus:outline-none focus:border-theme-accent"
            />
          </div>
        </div>

        {/* Complete Payment Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full theme-btn-primary font-black py-4 rounded-xl transition shadow-xl text-sm flex items-center justify-center gap-2 mt-4"
        >
          <Lock className="w-4 h-4 text-white" />
          <span>
            {isProcessing ? 'Verifying Card & Confirming Tickets...' : `Confirm & Pay $${totalAmount.toFixed(2)}`}
          </span>
        </button>
      </form>
    </div>
  );
}
