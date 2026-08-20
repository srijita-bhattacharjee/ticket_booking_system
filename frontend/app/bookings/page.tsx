'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookingService } from '../../services/api';
import { Ticket, QrCode, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

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
    if (!confirm('Are you sure you want to cancel this booking? Freed seats will automatically be offered to waitlisted customers.')) {
      return;
    }
    setCancellingId(bookingId);
    try {
      const res = await bookingService.cancel(bookingId);
      setMessage(res.data.message);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">My Booking History</h1>
        <p className="text-xs text-slate-400">View confirmed tickets, QR check-in tokens, or cancel bookings</p>
      </div>

      {message && (
        <div className="bg-emerald-950/80 border border-emerald-600 rounded-xl p-4 flex items-center gap-2 text-emerald-300 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-medium">You have no active or past bookings.</p>
          <Link
            href="/events"
            className="inline-block bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition"
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
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase bg-slate-800 text-sky-400 px-2 py-0.5 rounded border border-slate-700 font-bold">
                      {b.bookingReference}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isCancelled
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white">{b.event?.title}</h3>
                  <p className="text-xs text-slate-400">
                    Venue: {b.event?.venue?.name} • Date: {new Date(b.event?.eventDate).toLocaleDateString()} at {b.event?.startTime}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {b.seats?.map((s: any) => (
                      <span
                        key={s.eventSeatId}
                        className="text-[11px] bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-medium"
                      >
                        Row {s.eventSeat?.venueSeat?.rowNumber}-{s.eventSeat?.venueSeat?.seatNumber} ({s.eventSeat?.category})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                  {ticket && !isCancelled && (
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
                    >
                      <QrCode className="w-4 h-4" />
                      View QR Ticket
                    </Link>
                  )}

                  {!isCancelled && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      disabled={cancellingId === b.id}
                      className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
