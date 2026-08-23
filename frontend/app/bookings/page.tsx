'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookingService } from '../../services/api';
import { Ticket, QrCode, XCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; refundEligible: boolean } | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    bookingService
      .getUserBookings()
      .then((res) => setBookings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    setConfirmCancelId(null);
    try {
      const res = await bookingService.cancel(bookingId);
      setMessage({ text: res.data.message, refundEligible: res.data.refundEligible });
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-extrabold theme-text-main">My Booking History</h1>
        <p className="text-xs theme-text-secondary">View confirmed tickets, QR check-in tokens, or cancel bookings</p>
      </div>

      {message && (
        <div className={`theme-bg-elevated theme-border border rounded-xl p-4 flex items-center gap-2 text-sm font-semibold ${
          message.refundEligible ? 'text-emerald-400' : 'text-amber-400'
        }`}>
          {message.refundEligible
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 theme-text-secondary text-xs">Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 theme-text-secondary theme-bg-card theme-border border rounded-2xl space-y-3">
          <Ticket className="w-10 h-10 theme-text-secondary mx-auto" />
          <p className="text-sm font-medium theme-text-main">You have no active or past bookings.</p>
          <Link
            href="/events"
            className="inline-block theme-btn-primary font-bold px-4 py-2 rounded-xl text-xs transition"
          >
            Explore Events & Book Seats
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const ticket = b.tickets?.[0];
            const isCancelled = b.status === 'CANCELLED';

            return (
              <div
                key={b.id}
                className="theme-bg-card theme-border border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase theme-badge-accent px-2 py-0.5 rounded font-bold">
                      {b.bookingReference}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isCancelled
                          ? 'theme-bg-elevated theme-text-accent theme-border border'
                          : 'theme-badge-success'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold theme-text-main">{b.event?.title}</h3>
                  <p className="text-xs theme-text-secondary">
                    Venue: {b.event?.venue?.name} • Date: {new Date(b.event?.eventDate).toLocaleDateString()} at {b.event?.startTime}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {b.seats?.map((s: any) => (
                      <span
                        key={s.eventSeatId}
                        className="text-[11px] theme-bg-elevated theme-border border theme-text-main px-2.5 py-1 rounded-md font-medium"
                      >
                        Row {s.eventSeat?.venueSeat?.rowNumber}-{s.eventSeat?.venueSeat?.seatNumber} ({s.eventSeat?.category})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 md:border-l theme-border pt-4 md:pt-0 md:pl-6">
                  {ticket && !isCancelled && (
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="theme-btn-primary font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
                    >
                      <QrCode className="w-4 h-4 text-white" />
                      View QR Ticket
                    </Link>
                  )}

                  {!isCancelled && confirmCancelId !== b.id && (
                    <button
                      onClick={() => setConfirmCancelId(b.id)}
                      disabled={cancellingId === b.id}
                      className="border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Booking
                    </button>
                  )}

                  {/* Detailed Cancellation & Refund Confirmation Prompt */}
                  {!isCancelled && confirmCancelId === b.id && (() => {
                    const now = new Date();
                    const eventStart = new Date(b.event?.eventDate);
                    if (b.event?.startTime) {
                      const [h, m] = b.event.startTime.split(':').map(Number);
                      eventStart.setHours(h ?? 0, m ?? 0, 0, 0);
                    }
                    const hoursUntil = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
                    const isRefundable = hoursUntil >= 24;
                    const refundAmt = isRefundable ? (b.totalAmount || 0) : 0;

                    return (
                      <div className="w-full md:max-w-md theme-bg-elevated theme-border border-2 border-red-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between border-b theme-border pb-2">
                          <span className="text-xs font-extrabold text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            Confirm Cancellation
                          </span>
                          <span className="text-[10px] font-mono theme-text-secondary uppercase">
                            Ref: {b.bookingReference}
                          </span>
                        </div>

                        {/* Refundable Amount Display */}
                        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                          isRefundable
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          <div>
                            <span className="block text-[10px] uppercase font-mono tracking-wider opacity-80">
                              Refundable Amount
                            </span>
                            <span className="text-lg font-extrabold font-mono">
                              ₹{refundAmt.toFixed(2)}
                            </span>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-mono font-black ${
                            isRefundable
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {isRefundable ? '100% Refund Eligible' : 'Non-Refundable'}
                          </span>
                        </div>

                        <p className="text-[11px] theme-text-secondary leading-relaxed">
                          {isRefundable
                            ? `Showtime is in ${Math.round(hoursUntil)} hours (>=24h). Your full refund of ₹${refundAmt.toFixed(2)} will be credited in 5-7 business days.`
                            : `Showtime is in ${Math.max(0, Math.round(hoursUntil))} hours (<24h). As per policy, cancellations within 24 hours are non-refundable.`}
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            disabled={cancellingId === b.id}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {cancellingId === b.id ? 'Processing...' : 'Confirm Cancellation'}
                          </button>
                          <button
                            onClick={() => setConfirmCancelId(null)}
                            className="px-4 py-2 theme-btn-secondary font-bold rounded-xl text-xs transition shrink-0"
                          >
                            Keep Booking
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Policy Disclaimer */}
      <div className="theme-bg-card theme-border border rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold theme-text-main flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          Cancellation Policy
        </h3>
        <ul className="text-xs theme-text-secondary space-y-1.5 list-none">
          <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">•</span>Cancellations are allowed up to <strong className="theme-text-main">24 hours before</strong> the event start time.</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">•</span>Cancellations made within 24 hours of the event are <strong className="theme-text-main">non-refundable</strong>.</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">•</span>Refunds (if eligible) are processed within <strong className="theme-text-main">5–7 business days</strong> to the original payment method.</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">•</span>Food add-on combos are <strong className="theme-text-main">non-refundable</strong> once a booking is confirmed.</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">•</span>Cancelled seats are automatically offered to customers on the <strong className="theme-text-main">waitlist</strong>.</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 shrink-0 mt-0.5">•</span>TicketVerse reserves the right to cancel events due to unforeseen circumstances; full refunds will be issued in such cases.</li>
        </ul>
      </div>
    </div>
  );
}
