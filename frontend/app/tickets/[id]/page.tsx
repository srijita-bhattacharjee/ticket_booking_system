'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ticketService } from '../../../services/api';
import { CheckCircle2, ShieldCheck, Printer, AlertTriangle, Utensils, Tag, Ticket as TicketIcon } from 'lucide-react';

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (ticketId) {
      ticketService
        .getOne(ticketId)
        .then((res) => setTicketData(res.data))
        .catch((err) => setError('Ticket not found'))
        .finally(() => setLoading(false));
    }
  }, [ticketId]);

  const handleSimulateCheckIn = async () => {
    setCheckingIn(true);
    setCheckInMsg('');
    setError('');
    try {
      const res = await ticketService.checkIn(ticketId);
      setCheckInMsg(res.data.message);
      setTicketData((prev: any) => ({
        ...prev,
        status: 'CHECKED_IN',
        checkedInAt: res.data.ticket.checkedInAt,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) return <div className="text-center py-20 theme-text-secondary text-xs">Retrieving digital ticket pass...</div>;
  if (!ticketData) return <div className="text-center py-20 theme-text-secondary text-xs">Ticket not found</div>;

  const { booking, qrDataUrl } = ticketData;
  const addons = booking?.addons || [];

  return (
    <div className="max-w-xl mx-auto space-y-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold theme-text-main">Digital E-Ticket Pass</h1>
          <p className="text-xs theme-text-secondary">Official gate pass and food claim voucher</p>
        </div>
        <button
          onClick={() => window.print()}
          className="p-2.5 rounded-xl theme-bg-card theme-border border theme-text-main hover:opacity-80 transition"
          title="Print Ticket"
        >
          <Printer className="w-5 h-5" />
        </button>
      </div>

      {checkInMsg && (
        <div className="theme-bg-elevated theme-border border rounded-xl p-4 flex items-center gap-2 theme-text-success text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 theme-text-success" />
          <span>{checkInMsg}</span>
        </div>
      )}

      {error && (
        <div className="theme-bg-elevated theme-border border rounded-xl p-4 flex items-center gap-2 theme-text-accent text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 theme-text-accent" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Digital Ticket Pass Card */}
      <div className="theme-bg-card theme-border border rounded-3xl overflow-hidden shadow-2xl space-y-6">
        <div className="bg-gradient-to-r from-[#FF6847] via-[#D94727] to-[#20242B] p-6 text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase bg-black/40 px-2.5 py-1 rounded border border-white/20">
              Ref: {booking?.bookingReference}
            </span>
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                ticketData.status === 'CHECKED_IN'
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-white text-slate-950'
              }`}
            >
              {ticketData.status}
            </span>
          </div>
          <h2 className="text-2xl font-bold pt-2">{booking?.event?.title}</h2>
          <p className="text-xs opacity-90">Venue: {booking?.event?.venue?.name} ({booking?.event?.venue?.location})</p>
        </div>

        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="bg-white p-6 rounded-2xl w-fit mx-auto shadow-inner text-center space-y-2">
            {qrDataUrl && <img src={qrDataUrl} alt="QR Gate Pass" className="w-52 h-52 mx-auto" />}
            <p className="text-[10px] text-slate-600 font-mono font-bold">HMAC SHA-256 Signed Gate Token</p>
          </div>

          {/* Attendee Details */}
          <div className="grid grid-cols-2 gap-4 text-xs theme-bg-elevated p-4 rounded-xl theme-border border">
            <div>
              <span className="theme-text-secondary">Attendee Name:</span>
              <p className="font-bold theme-text-main text-sm">{booking?.user?.name}</p>
            </div>
            <div>
              <span className="theme-text-secondary">Event Date & Time:</span>
              <p className="font-bold theme-text-main text-sm">
                {new Date(booking?.event?.eventDate).toLocaleDateString()} at {booking?.event?.startTime}
              </p>
            </div>
          </div>

          {/* Confirmed Seats */}
          <div className="space-y-2">
            <span className="text-xs font-bold theme-text-secondary flex items-center gap-1.5">
              <TicketIcon className="w-4 h-4 theme-text-accent" /> Confirmed Seats
            </span>
            <div className="flex flex-wrap gap-2">
              {booking?.seats?.map((s: any) => (
                <span
                  key={s.eventSeatId}
                  className="theme-bg-elevated theme-border border theme-text-accent text-xs px-3 py-1.5 rounded-lg font-bold"
                >
                  Row {s.eventSeat?.venueSeat?.rowNumber} - Seat {s.eventSeat?.venueSeat?.seatNumber} ({s.eventSeat?.category})
                </span>
              ))}
            </div>
          </div>

          {/* Food Combos & Claim Vouchers */}
          {addons.length > 0 && (
            <div className="space-y-3 border-t theme-border pt-4">
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-500" /> Food & Beverage Counter Vouchers
              </span>

              <div className="space-y-2">
                {addons.map((ad: any) => (
                  <div
                    key={ad.id}
                    className="theme-bg-elevated theme-border border rounded-xl p-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold theme-text-main">{ad.menuItem?.name}</p>
                      <p className="text-[10px] theme-text-secondary">📍 Counter: {ad.menuItem?.stall?.location || ad.menuItem?.stall?.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="theme-bg-card theme-border border theme-text-accent font-extrabold text-xs px-2.5 py-1 rounded-lg">
                        Qty: {ad.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applied Coupon Info */}
          {booking?.couponCode && (
            <div className="theme-bg-elevated p-3 rounded-xl theme-border border flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 theme-text-main font-semibold">
                <Tag className="w-4 h-4 theme-text-success" /> Coupon Redeemed ({booking.couponCode})
              </span>
              <span className="theme-text-success font-bold">Saved ${booking.discountAmount?.toFixed(2)}</span>
            </div>
          )}

          {/* Organiser Gate Scanner Action */}
          <div className="border-t theme-border pt-4">
            <button
              onClick={handleSimulateCheckIn}
              disabled={checkingIn || ticketData.status === 'CHECKED_IN'}
              className="w-full theme-btn-secondary font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 theme-text-success" />
              {ticketData.status === 'CHECKED_IN'
                ? `Checked In at ${new Date(ticketData.checkedInAt).toLocaleTimeString()}`
                : checkingIn
                ? 'Scanning Gate Token...'
                : 'Simulate Organiser Gate QR Check-In Scanner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
