'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ticketService } from '../../../services/api';
import { QrCode, CheckCircle2, ShieldCheck, Printer, AlertTriangle } from 'lucide-react';

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

  if (loading) return <div className="text-center py-20 text-slate-500">Retrieving digital ticket...</div>;
  if (!ticketData) return <div className="text-center py-20 text-slate-400">Ticket not found</div>;

  const { booking, qrDataUrl } = ticketData;

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Digital E-Ticket</h1>
          <p className="text-xs text-slate-400">Official gate pass for event entry</p>
        </div>
        <button
          onClick={() => window.print()}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
          title="Print Ticket"
        >
          <Printer className="w-5 h-5" />
        </button>
      </div>

      {checkInMsg && (
        <div className="bg-emerald-950/80 border border-emerald-600 rounded-xl p-4 flex items-center gap-2 text-emerald-300 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{checkInMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/80 border border-rose-600/60 rounded-xl p-4 flex items-center gap-2 text-rose-300 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-6">
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 p-6 text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase bg-slate-950/40 px-2.5 py-1 rounded border border-white/20">
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
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400">Attendee Name:</span>
              <p className="font-bold text-white text-sm">{booking?.user?.name}</p>
            </div>
            <div>
              <span className="text-slate-400">Event Date & Time:</span>
              <p className="font-bold text-white text-sm">
                {new Date(booking?.event?.eventDate).toLocaleDateString()} at {booking?.event?.startTime}
              </p>
            </div>
          </div>

          {/* Reserved Seats List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400">Confirmed Seats</span>
            <div className="flex flex-wrap gap-2">
              {booking?.seats?.map((s: any) => (
                <span
                  key={s.eventSeatId}
                  className="bg-slate-800 border border-slate-700 text-sky-300 text-xs px-3 py-1.5 rounded-lg font-bold"
                >
                  Row {s.eventSeat?.venueSeat?.rowNumber} - Seat {s.eventSeat?.venueSeat?.seatNumber} ({s.eventSeat?.category})
                </span>
              ))}
            </div>
          </div>

          {/* Organiser Gate Scanner Action */}
          <div className="border-t border-slate-800 pt-4">
            <button
              onClick={handleSimulateCheckIn}
              disabled={checkingIn || ticketData.status === 'CHECKED_IN'}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
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
