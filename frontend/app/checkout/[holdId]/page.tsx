'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { holdService, bookingService } from '../../../services/api';
import CountdownTimer from '../../../components/CountdownTimer';
import { CreditCard, ShieldCheck, Ticket, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const holdId = params.holdId as string;

  const [hold, setHold] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingInProcess, setBookingInProcess] = useState(false);
  const [error, setError] = useState('');
  const [idempotencyKey] = useState(() => 'IDEM-' + Math.random().toString(36).substring(2, 10));

  useEffect(() => {
    if (holdId) {
      holdService
        .getDetails(holdId)
        .then((res) => setHold(res.data))
        .catch((err) => {
          setError(err.response?.data?.message || 'Hold session has expired or is invalid');
        })
        .finally(() => setLoading(false));
    }
  }, [holdId]);

  const handleCompleteBooking = async () => {
    setBookingInProcess(true);
    setError('');
    try {
      const res = await bookingService.create(holdId, idempotencyKey);
      router.push(`/tickets/${res.data.ticket.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking creation failed. Seats may have expired.');
    } finally {
      setBookingInProcess(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Verifying hold session...</div>;

  if (error && !hold) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-full bg-rose-950/80 border border-rose-600/60 w-fit mx-auto text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Hold Session Expired</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={() => router.push('/events')}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition"
        >
          Return to Events
        </button>
      </div>
    );
  }

  const seatsList = hold?.seats || [];
  const totalPrice = seatsList.reduce((sum: number, s: any) => sum + s.eventSeat?.price, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Checkout & Instant Ticket Claim</h1>
        <p className="text-xs text-slate-400">Your seats are locked. Complete your booking before timer expiry.</p>
      </div>

      {/* Live Countdown Timer */}
      {hold?.expiresAt && (
        <CountdownTimer
          expiresAt={hold.expiresAt}
          onExpire={() => setError('Hold duration expired. Seats released back to availability.')}
        />
      )}

      {error && (
        <div className="bg-rose-950/80 border border-rose-600/60 rounded-xl p-4 flex items-center gap-2 text-rose-300 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">{hold?.event?.eventType}</span>
          <h2 className="text-2xl font-bold text-white mt-1">{hold?.event?.title}</h2>
          <p className="text-xs text-slate-400">Venue: {hold?.event?.venue?.name} • Date: {new Date(hold?.event?.eventDate).toLocaleDateString()}</p>
        </div>

        {/* Seats List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300">Reserved Seats</h3>
          <div className="space-y-2">
            {seatsList.map((s: any) => (
              <div
                key={s.eventSeatId}
                className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">
                      Row {s.eventSeat?.venueSeat?.rowNumber} — Seat {s.eventSeat?.venueSeat?.seatNumber}
                    </p>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{s.eventSeat?.category}</span>
                  </div>
                </div>
                <span className="font-bold text-slate-200">${s.eventSeat?.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-slate-800 pt-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Service & Booking Fee</span>
            <span className="text-emerald-400">FREE</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800/60">
            <span>Total Payable</span>
            <span className="text-sky-400">${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Concurrency & Idempotency Badge */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>
            Protected with Idempotency Key: <code className="text-sky-400 font-mono">{idempotencyKey}</code>. Duplicate clicks will not generate duplicate bookings.
          </span>
        </div>

        {/* Payment Action */}
        <button
          onClick={handleCompleteBooking}
          disabled={bookingInProcess}
          className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-extrabold py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/20 text-base flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          {bookingInProcess ? 'Processing Transaction & Generating QR...' : `Confirm & Pay $${totalPrice.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
