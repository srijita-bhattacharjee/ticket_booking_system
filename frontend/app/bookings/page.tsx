'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookingService } from '../../services/api';
import { Ticket, QrCode, XCircle, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-extrabold theme-text-main">My Booking History</h1>
        <p className="text-xs theme-text-secondary">View confirmed tickets, QR check-in tokens, or cancel bookings</p>
      </div>

      {message && (
        <div className="theme-bg-elevated theme-border border rounded-xl p-4 flex items-center gap-2 theme-text-success text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 theme-text-success" />
          <span>{message}</span>
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

                  {!isCancelled && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      disabled={cancellingId === b.id}
                      className="theme-btn-secondary font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4 theme-text-accent" />
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
