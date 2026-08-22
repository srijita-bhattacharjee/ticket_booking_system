'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { bookingService } from '../../services/api';
import Link from 'next/link';
import { User, Mail, Shield, Ticket, DollarSign, QrCode, Calendar, Clock, MapPin, CheckCircle2, XCircle, ArrowRight, ExternalLink } from 'lucide-react';

export default function AccountPage() {
  const { user, isCustomer, isOrganiser, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      bookingService
        .getUserBookings()
        .then((res) => setBookings(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingBookings(false));
    }
  }, [isAuthenticated]);

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking? Held seats will be released back to the waitlist.')) return;
    setCancellingId(id);
    try {
      await bookingService.cancel(id);
      const res = await bookingService.getUserBookings();
      setBookings(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading) {
    return <div className="text-center py-20 theme-text-secondary text-xs">Loading profile account data...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-full theme-bg-elevated theme-border border w-fit mx-auto theme-text-accent">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold theme-text-main">Authentication Required</h2>
        <p className="text-xs theme-text-secondary">Log in to your account to view profile details and past orders.</p>
        <Link
          href="/login"
          className="inline-block theme-btn-primary font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const totalSpent = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const activeTicketsCount = confirmedBookings.reduce((sum, b) => sum + (b.tickets?.length || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4">
      {/* Account Profile Header Card */}
      <div className="theme-bg-card theme-border border rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl theme-btn-primary p-1 shadow-lg">
              <div className="w-full h-full theme-bg-main rounded-xl flex items-center justify-center theme-text-accent">
                <User className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold theme-text-main tracking-tight">{user.name}</h1>
                <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-full theme-badge-accent">
                  {user.role}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs theme-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 theme-text-secondary" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 theme-text-secondary" />
                  Account ID: <code className="theme-text-main font-mono text-[11px]">{user.id.substring(0, 8)}...</code>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l theme-border pt-4 md:pt-0 md:pl-6">
            <Link
              href="/events"
              className="theme-btn-primary font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
            >
              Browse Shows
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* CUSTOMER ACCOUNT VIEW */}
      {isCustomer && (
        <div className="space-y-8">
          {/* Customer Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="theme-bg-card theme-border border rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between theme-text-secondary text-xs font-medium">
                <span>Total Bookings</span>
                <Ticket className="w-4 h-4 theme-text-accent" />
              </div>
              <p className="text-2xl font-extrabold theme-text-main">{bookings.length}</p>
              <p className="text-[11px] theme-text-secondary">{confirmedBookings.length} Active • {bookings.length - confirmedBookings.length} Cancelled</p>
            </div>

            <div className="theme-bg-card theme-border border rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between theme-text-secondary text-xs font-medium">
                <span>Total Spent</span>
                <DollarSign className="w-4 h-4 theme-text-success" />
              </div>
              <p className="text-2xl font-extrabold theme-text-success">${totalSpent.toFixed(2)}</p>
              <p className="text-[11px] theme-text-secondary">Across confirmed event orders</p>
            </div>

            <div className="theme-bg-card theme-border border rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between theme-text-secondary text-xs font-medium">
                <span>Active E-Tickets</span>
                <QrCode className="w-4 h-4 theme-text-accent" />
              </div>
              <p className="text-2xl font-extrabold theme-text-accent">{activeTicketsCount}</p>
              <p className="text-[11px] theme-text-secondary">QR Gate Passes available</p>
            </div>
          </div>

          {/* Past Orders & Bookings History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold theme-text-main">Past Orders & Booking History</h2>
                <p className="text-xs theme-text-secondary">View digital QR tickets, order details, or cancel active seat holds</p>
              </div>
              <Link
                href="/events"
                className="theme-badge-accent px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                Book More Tickets
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingBookings ? (
              <div className="text-center py-12 theme-text-secondary text-xs">Loading order history...</div>
            ) : bookings.length === 0 ? (
              <div className="theme-bg-card theme-border border rounded-2xl p-12 text-center space-y-3">
                <Ticket className="w-12 h-12 theme-text-secondary mx-auto" />
                <h3 className="text-lg font-bold theme-text-main">No Bookings Yet</h3>
                <p className="text-xs theme-text-secondary max-w-sm mx-auto">
                  You haven't reserved any tickets yet. Explore live events and select seats on the visual grid.
                </p>
                <Link
                  href="/events"
                  className="inline-block theme-btn-primary font-bold px-5 py-2.5 rounded-xl text-xs transition"
                >
                  Explore Upcoming Events
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4 hover:border-theme-accent transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b theme-border pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              booking.status === 'CONFIRMED'
                                ? 'theme-badge-success'
                                : 'theme-bg-elevated theme-text-accent theme-border border'
                            }`}
                          >
                            {booking.status}
                          </span>
                          <span className="text-xs font-mono theme-text-secondary">Ref: {booking.bookingReference}</span>
                        </div>
                        <h3 className="text-lg font-bold theme-text-main">{booking.event?.title}</h3>
                        <p className="text-xs theme-text-secondary">
                          📍 {booking.event?.venue?.name} • 📅 {new Date(booking.event?.eventDate).toLocaleDateString()} at {booking.event?.startTime}
                        </p>
                      </div>

                      <div className="text-left sm:text-right space-y-1">
                        <span className="text-[11px] theme-text-secondary block">Total Amount Paid</span>
                        <p className="text-xl font-extrabold theme-text-accent">${booking.totalAmount?.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Seats Breakdown */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold theme-text-secondary">Reserved Seats ({booking.seats?.length}):</span>
                      <div className="flex flex-wrap gap-2">
                        {booking.seats?.map((s: any) => (
                          <span
                            key={s.eventSeatId}
                            className="theme-bg-elevated theme-border border theme-text-main text-xs px-3 py-1 rounded-lg font-bold"
                          >
                            Row {s.eventSeat?.venueSeat?.rowNumber} - Seat {s.eventSeat?.venueSeat?.seatNumber} ({s.eventSeat?.category})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Digital QR Ticket Action */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t theme-border">
                      <div className="flex items-center gap-2">
                        {booking.tickets && booking.tickets.length > 0 && (
                          <Link
                            href={`/tickets/${booking.tickets[0].id}`}
                            className="theme-btn-primary font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
                          >
                            <QrCode className="w-4 h-4" />
                            View Digital E-Ticket Pass
                          </Link>
                        )}
                      </div>

                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="theme-btn-secondary font-bold px-3.5 py-2 rounded-xl text-xs transition"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORGANISER ACCOUNT VIEW */}
      {isOrganiser && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b theme-border pb-4">
            <div>
              <h2 className="text-xl font-bold theme-text-main">Organiser Control Portal</h2>
              <p className="text-xs theme-text-secondary">Manage hosted events, seat maps, occupancy, and food chain partnerships</p>
            </div>
            <Link
              href="/organiser/events/create"
              className="theme-btn-primary font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
            >
              + Publish New Event
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold theme-text-main">Hosted Events Dashboard</h3>
              <p className="text-xs theme-text-secondary">Monitor live ticket sales, seat heatmaps, and waitlists in real-time.</p>
              <Link
                href="/organiser/dashboard"
                className="inline-block theme-btn-primary font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Go to Dashboard
              </Link>
            </div>

            <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold theme-text-main">Food Partnerships & Coupons Hub</h3>
              <p className="text-xs theme-text-secondary">Upload proof of food chain partnerships and issue event discount coupons.</p>
              <Link
                href="/organiser/coupons"
                className="inline-block theme-btn-secondary font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Go to Coupons Hub
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ACCOUNT VIEW */}
      {isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b theme-border pb-4">
            <div>
              <h2 className="text-xl font-bold theme-text-main">Admin System Management</h2>
              <p className="text-xs theme-text-secondary">Manage venue seat grid layouts, food stalls, and organiser partnership approvals</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold theme-text-main">Venue Seat Layout Builder</h3>
              <p className="text-xs theme-text-secondary">Configure venue seat rows, seat capacity, and seat tier categories.</p>
              <Link
                href="/admin/venues"
                className="inline-block theme-btn-primary font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Manage Venues
              </Link>
            </div>

            <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold theme-text-main">Food Stalls & Partnerships Review</h3>
              <p className="text-xs theme-text-secondary">Manage food counters, menu items, and review organiser partnership submissions.</p>
              <Link
                href="/admin/food"
                className="inline-block theme-btn-secondary font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Manage Food & Partnerships
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
