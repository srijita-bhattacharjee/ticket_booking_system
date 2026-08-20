'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { eventService, holdService, waitlistService } from '../../../services/api';
import SeatMap from '../../../components/SeatMap';
import WaitlistCard from '../../../components/WaitlistCard';
import { Ticket, ArrowLeft, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerToken = searchParams.get('offerToken');

  const eventId = params.id as string;
  const [event, setEvent] = useState<any>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [error, setError] = useState('');
  const [offerSuccess, setOfferSuccess] = useState('');

  useEffect(() => {
    if (eventId) {
      eventService
        .getOne(eventId)
        .then((res) => setEvent(res.data))
        .catch((err) => setError('Failed to load event details'))
        .finally(() => setLoading(false));
    }
  }, [eventId]);

  const handleAcceptWaitlistOffer = async () => {
    if (!offerToken) return;
    try {
      const res = await waitlistService.acceptOffer(offerToken);
      setOfferSuccess(res.data.message);
      setTimeout(() => {
        router.push(`/checkout/${res.data.holdId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to claim waitlist offer');
    }
  };

  const toggleSeat = (seatId: string) => {
    setSelectedSeatIds((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  };

  const selectedSeatsDetails = event?.seats?.filter((s: any) => selectedSeatIds.includes(s.id)) || [];
  const totalPrice = selectedSeatsDetails.reduce((sum: number, s: any) => sum + s.price, 0);

  const handleHoldAndProceed = async () => {
    if (selectedSeatIds.length === 0) return;
    setHolding(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=' + encodeURIComponent(`/events/${eventId}`));
        return;
      }
      const res = await holdService.create(eventId, selectedSeatIds);
      router.push(`/checkout/${res.data.holdId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place hold on selected seats');
    } finally {
      setHolding(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Loading seat map grid...</div>;
  if (!event) return <div className="text-center py-20 text-slate-400">Event not found</div>;

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.back()}
        className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </button>

      {/* Waitlist Offer Claim Banner */}
      {offerToken && (
        <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 border border-purple-600 rounded-2xl p-6 flex items-center justify-between shadow-xl shadow-purple-900/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Sparkles className="w-5 h-5" />
              <span>Waitlist Offer Reserved For You!</span>
            </div>
            <p className="text-xs text-purple-200">
              A seat in your requested category has opened up. Claim your 15-minute hold offer now.
            </p>
          </div>
          <button
            onClick={handleAcceptWaitlistOffer}
            className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-lg shadow-purple-500/30"
          >
            Claim Offer & Checkout
          </button>
        </div>
      )}

      {offerSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-600 rounded-xl p-4 flex items-center gap-2 text-emerald-300 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{offerSuccess}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs uppercase px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
            {event.eventType}
          </span>
          <h1 className="text-3xl font-extrabold text-white">{event.title}</h1>
          <p className="text-xs text-slate-400 max-w-xl">{event.description}</p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
            <span>📍 {event.venue?.name} ({event.venue?.location})</span>
            <span>📅 {new Date(event.eventDate).toLocaleDateString()} at {event.startTime}</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Tiered Pricing</span>
          <div className="text-xs space-y-0.5">
            <p className="text-amber-400 font-bold">Premium: ${event.seats?.find((s: any) => s.category === 'PREMIUM')?.price || 50}</p>
            <p className="text-emerald-400 font-bold">Standard: ${event.seats?.find((s: any) => s.category === 'STANDARD')?.price || 30}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/80 border border-rose-600/60 rounded-xl p-4 flex items-center gap-2 text-rose-300 text-sm font-semibold">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interactive Visual Seat Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Visual Interactive Seat Map</h3>
            <span className="text-xs text-slate-400">Click any available seat to select</span>
          </div>

          <SeatMap
            eventId={eventId}
            seats={event.seats || []}
            selectedSeatIds={selectedSeatIds}
            onSeatToggle={toggleSeat}
          />
        </div>

        {/* Selected Seats Summary & Checkout Action */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-sky-400" />
              Booking Summary
            </h3>

            {selectedSeatIds.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No seats selected yet. Click seats on the visual grid to start.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {selectedSeatsDetails.map((seat: any) => (
                    <div
                      key={seat.id}
                      className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800"
                    >
                      <div>
                        <p className="font-bold text-slate-200">
                          Row {seat.venueSeat?.rowNumber} — Seat {seat.venueSeat?.seatNumber}
                        </p>
                        <span
                          className={`text-[10px] uppercase font-semibold ${
                            seat.category === 'PREMIUM' ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {seat.category}
                        </span>
                      </div>
                      <span className="font-bold text-white">${seat.price}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-300">Total Price</span>
                  <span className="text-2xl font-extrabold text-sky-400">${totalPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleHoldAndProceed}
                  disabled={holding}
                  className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-sky-500/25 text-sm"
                >
                  {holding ? 'Locking Seats in Redis & DB...' : 'Hold Seats (10m TTL) & Checkout'}
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  🔒 Places an atomic 10-minute hold guard. Auto-releases if abandoned.
                </p>
              </div>
            )}
          </div>

          {/* Waitlist Section */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Category Waitlists</h3>
            <WaitlistCard eventId={eventId} category="PREMIUM" />
            <WaitlistCard eventId={eventId} category="STANDARD" />
          </div>
        </div>
      </div>
    </div>
  );
}
