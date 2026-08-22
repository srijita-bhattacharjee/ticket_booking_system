'use client';

import { useState } from 'react';
import { bookingService } from '../services/api';
import { ShieldCheck, Lock, Sparkles, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RazorpayPaymentModalProps {
  holdId: string;
  totalAmount: number;
  onPaymentSuccess: (rzpResponse: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  isProcessing: boolean;
}

export default function RazorpayPaymentModal({
  holdId,
  totalAmount,
  onPaymentSuccess,
  isProcessing,
}: RazorpayPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dynamically inject Razorpay Standard Checkout SDK Script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Ensure Razorpay Checkout SDK is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setError('Failed to load Razorpay Checkout SDK. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // 2. STEP 1: Call Backend to Create Order (POST /api/bookings/create-order)
      const orderRes = await bookingService.createRazorpayOrder(holdId, totalAmount);
      const { order_id, amount, currency, key_id } = orderRes.data;

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || key_id || 'rzp_test_TSwIU7lKwpGM1y';

      // 3. STEP 2: Configure & Open Official Razorpay Checkout Modal
      const options = {
        key: razorpayKey,
        amount: amount, // Amount in paise
        currency: currency || 'INR',
        name: 'TicketVerse',
        description: 'Event Seat Reservation & Add-Ons Pass',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=200&q=80',
        order_id: order_id,
        handler: function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          // Success! Pass payment credentials to backend verification handler
          onPaymentSuccess({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        prefill: {
          name: 'Srijita Bhattacharjee',
          email: 'srijita@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#FF6847', // Warm coral accent matching dark mode theme
        },
        modal: {
          ondismiss: function () {
            setError('Payment cancelled by user. Your seats remain held for the duration of the timer.');
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);

      // Listen for payment failure events
      razorpayInstance.on('payment.failed', function (response: any) {
        setError(response.error?.description || 'Payment failed. Please try another card or UPI app.');
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Unable to initiate Razorpay checkout.');
      setLoading(false);
    }
  };

  return (
    <div className="theme-bg-card theme-border border-2 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b theme-border pb-4">
        <div>
          <span className="text-[10px] font-mono font-black uppercase tracking-widest theme-text-accent flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> RAZORPAY STANDARD WEB CHECKOUT
          </span>
          <h3 className="text-lg sm:text-xl font-black theme-text-main mt-0.5 flex items-center gap-2 flex-wrap">
            <span>Pay with Razorpay</span>
            <span className="text-[10px] font-mono theme-text-accent font-semibold border theme-border px-2 py-0.5 rounded-full theme-bg-elevated">
              TEST MODE
            </span>
          </h3>
        </div>
        <div className="w-fit flex items-center gap-1.5 theme-bg-elevated px-2.5 py-1 rounded-full theme-border border text-[10px] font-mono font-bold theme-text-success shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>HMAC Verified</span>
        </div>
      </div>

      {/* Supported Payment Methods Badge */}
      <div className="p-3 sm:p-4 rounded-2xl theme-bg-elevated theme-border border space-y-3 overflow-hidden">
        <span className="text-[11px] font-mono font-bold theme-text-secondary uppercase block">
          Supported Checkout Options
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="p-2 rounded-xl theme-bg-card theme-border border text-center space-y-0.5 overflow-hidden">
            <span className="text-sm block">⚡</span>
            <span className="text-[10px] font-bold theme-text-main block truncate">UPI Instant</span>
            <span className="text-[8px] theme-text-secondary block truncate">GPay / PhonePe</span>
          </div>

          <div className="p-2 rounded-xl theme-bg-card theme-border border text-center space-y-0.5 overflow-hidden">
            <span className="text-sm block">💳</span>
            <span className="text-[10px] font-bold theme-text-main block truncate">Cards</span>
            <span className="text-[8px] theme-text-secondary block truncate">Visa / RuPay / MC</span>
          </div>

          <div className="p-2 rounded-xl theme-bg-card theme-border border text-center space-y-0.5 overflow-hidden">
            <span className="text-sm block">🏦</span>
            <span className="text-[10px] font-bold theme-text-main block truncate">NetBanking</span>
            <span className="text-[8px] theme-text-secondary block truncate">Indian Banks</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl theme-bg-elevated theme-border border flex items-center gap-2 theme-text-accent text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 theme-text-accent" />
          <span>{error}</span>
        </div>
      )}

      {/* Checkout Action Button */}
      <button
        type="button"
        onClick={handleRazorpayCheckout}
        disabled={isProcessing || loading}
        className="w-full theme-btn-primary font-black py-4 rounded-2xl transition shadow-2xl text-sm flex items-center justify-center gap-2"
      >
        <Lock className="w-4 h-4 text-white" />
        <span>
          {isProcessing || loading
            ? 'Opening Secure Razorpay Modal...'
            : `Pay ₹${Math.round(totalAmount)} with Razorpay →`}
        </span>
      </button>
    </div>
  );
}
