'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { holdService, bookingService } from '../../../../services/api';
import { useAuth } from '../../../../hooks/useAuth';
import { CreditCard, Lock, ShieldCheck, Ticket, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function HostedStripeCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const holdId = params.holdId as string;
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [hold, setHold] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [name, setName] = useState('Srijita Bhattacharjee');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (holdId) {
      holdService
        .getDetails(holdId)
        .then((res) => setHold(res.data))
        .catch((err) => {
          console.error(err);
          setError('Hold session expired or invalid');
        })
        .finally(() => setLoading(false));
    }
  }, [holdId]);

  const handleStripePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);
    setError('');

    try {
      const res = await bookingService.create({
        holdId,
        idempotencyKey: 'STRIPE-HOSTED-' + Math.random().toString(36).substring(2, 9),
      });

      const ticketId = res.data.ticket?.id || res.data.tickets?.[0]?.id;
      if (ticketId) {
        router.push(`/tickets/${ticketId}`);
      } else {
        router.push('/bookings');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Payment processing failed');
      setIsPaying(false);
    }
  };

  const seatsList = hold?.seats || [];
  const seatsSubtotal = seatsList.reduce((acc: number, s: any) => acc + s.eventSeat.price, 0);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center text-white font-mono text-xs">
        Loading Stripe Hosted Checkout...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1117] text-white flex flex-col justify-between py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 my-auto">
        {/* Left Column — Stripe Order Summary */}
        <div className="space-y-6 bg-[#161B22] p-8 rounded-3xl border border-gray-800 shadow-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>checkout.stripe.com</span>
            </div>

            <div>
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Event Ticket Order</span>
              <h1 className="text-2xl font-extrabold text-white mt-1">{hold?.event?.title || 'Event Pass'}</h1>
              <p className="text-xs text-gray-400 mt-1">Venue: {hold?.event?.venue?.name}</p>
            </div>

            {/* Reserved Seats List */}
            <div className="space-y-2 border-t border-b border-gray-800 py-4">
              <h3 className="text-xs font-bold text-gray-300 uppercase font-mono flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-amber-500" /> Reserved Seats ({seatsList.length})
              </h3>
              {seatsList.map((s: any) => (
                <div key={s.eventSeatId} className="flex justify-between text-xs font-mono text-gray-300">
                  <span>Row {s.eventSeat?.venueSeat?.rowNumber} • Seat {s.eventSeat?.venueSeat?.seatNumber}</span>
                  <span className="font-bold text-white">${s.eventSeat?.price}</span>
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-xs font-mono text-gray-400 uppercase">Total Amount Due</span>
              <span className="text-3xl font-black text-emerald-400 font-mono">${seatsSubtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 font-mono border-t border-gray-800 pt-4 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Powered by Stripe • Encrypted 256-bit Connection</span>
          </div>
        </div>

        {/* Right Column — Stripe Card Form */}
        <div className="bg-[#161B22] p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" /> Card Details
            </h2>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> TEST MODE
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleStripePay} className="space-y-4 font-mono">
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400 uppercase">Cardholder Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[#0E1117] border border-gray-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-gray-400 uppercase">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[#0E1117] border border-gray-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 uppercase">Expiry</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#0E1117] border border-gray-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 uppercase">CVC</label>
                <input
                  type="password"
                  maxLength={4}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#0E1117] border border-gray-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPaying}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold py-4 rounded-xl transition text-sm flex items-center justify-center gap-2 mt-4 shadow-lg disabled:opacity-50"
            >
              {isPaying ? (
                <span>Authorizing Bank Transaction...</span>
              ) : (
                <>
                  <span>Pay ${seatsSubtotal.toFixed(2)} with Stripe</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
