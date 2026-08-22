'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { eventService, holdService, waitlistService } from '../../../services/api';
import SeatMap from '../../../components/SeatMap';
import WaitlistCard from '../../../components/WaitlistCard';
import { Ticket, ArrowLeft, ShieldAlert, Sparkles, CheckCircle2, MapPin, Calendar, Clock } from 'lucide-react';

function EventDetailContent() {
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

  if (loading) return <div className="text-center py-20 theme-text-secondary text-xs">Loading seat map grid...</div>;
  if (!event) return <div className="text-center py-20 theme-text-secondary text-xs">Event not found</div>;

  const displayImage = event.imageUrl || event.venue?.imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.back()}
        className="text-xs font-semibold theme-text-secondary hover:theme-text-main flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </button>

      {/* Waitlist Offer Claim Banner */}
      {offerToken && (
        <div className="theme-bg-card theme-border border rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 theme-text-accent font-bold text-base">
              <Sparkles className="w-5 h-5" />
              <span>Waitlist Offer Reserved For You!</span>
            </div>
            <p className="text-xs theme-text-secondary">
              A seat in your requested category has opened up. Claim your 15-minute hold offer now.
            </p>
          </div>
          <button
            onClick={handleAcceptWaitlistOffer}
            className="theme-btn-primary font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-md"
          >
            Claim Offer & Checkout
          </button>
        </div>
      )}

      {offerSuccess && (
        <div className="theme-bg-elevated theme-border border rounded-xl p-4 flex items-center gap-2 theme-text-success text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 theme-text-success" />
          <span>{offerSuccess}</span>
        </div>
      )}

      {/* Header Banner with Cover Image */}
      <div className="theme-bg-card theme-border border rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="h-56 sm:h-72 w-full relative overflow-hidden theme-bg-main">
          <img
            src={displayImage}
            alt={event.title}
            className="w-full h-full object-cover object-center opacity-40 backdrop-blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider px-3 py-1 rounded-full theme-bg-elevated theme-text-accent theme-border border font-extrabold backdrop-blur-md">
                {event.eventType}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">{event.title}</h1>
              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl drop-shadow-sm">{event.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-200 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 theme-text-accent" />
                  {event.venue?.name} ({event.venue?.location})
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-300" />
                  {new Date(event.eventDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {event.startTime}
                </span>
              </div>
            </div>

            <div className="theme-bg-card p-4 rounded-2xl theme-border border text-right space-y-1 shrink-0">
              <span className="text-[10px] theme-text-secondary uppercase font-bold tracking-wider">Tiered Pricing</span>
              <div className="text-xs space-y-0.5">
                <p className="theme-text-accent font-bold">Premium: ${event.seats?.find((s: any) => s.category === 'PREMIUM')?.price || 50}</p>
                <p className="theme-text-success font-bold">Standard: ${event.seats?.find((s: any) => s.category === 'STANDARD')?.price || 30}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="theme-bg-elevated theme-border border rounded-xl p-4 flex items-center gap-2 theme-text-accent text-sm font-semibold">
          <ShieldAlert className="w-5 h-5 theme-text-accent" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interactive Visual Seat Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold theme-text-main">Visual Interactive Seat Map</h3>
            <span className="text-xs theme-text-secondary">Click any available seat to select</span>
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
          <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold theme-text-main border-b theme-border pb-3 flex items-center gap-2">
              <Ticket className="w-5 h-5 theme-text-accent" />
              Booking Summary
            </h3>

            {selectedSeatIds.length === 0 ? (
              <div className="text-center py-8 theme-text-secondary text-xs">
                No seats selected yet. Click seats on the visual grid to start.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {selectedSeatsDetails.map((seat: any) => (
                    <div
                      key={seat.id}
                      className="flex items-center justify-between text-xs theme-bg-elevated p-2.5 rounded-lg theme-border border"
                    >
                      <div>
                        <p className="font-bold theme-text-main">
                          Row {seat.venueSeat?.rowNumber} — Seat {seat.venueSeat?.seatNumber}
                        </p>
                        <span
                          className={`text-[10px] uppercase font-semibold ${
                            seat.category === 'PREMIUM' ? 'theme-text-accent' : 'theme-text-success'
                          }`}
                        >
                          {seat.category}
                        </span>
                      </div>
                      <span className="font-bold theme-text-main">${seat.price}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t theme-border pt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold theme-text-secondary">Total Price</span>
                  <span className="text-2xl font-extrabold theme-text-accent">${totalPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleHoldAndProceed}
                  disabled={holding}
                  className="w-full theme-btn-primary font-bold py-3 rounded-xl transition text-sm shadow-md"
                >
                  {holding ? 'Locking Seats in Redis & DB...' : 'Hold Seats (10m TTL) & Checkout'}
                </button>
                <p className="text-[11px] theme-text-secondary text-center">
                  🔒 Places an atomic 10-minute hold guard. Auto-releases if abandoned.
                </p>
              </div>
            )}
          </div>

          {/* Waitlist Section */}
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main">Category Waitlists</h3>
            <WaitlistCard eventId={eventId} category="PREMIUM" />
            <WaitlistCard eventId={eventId} category="STANDARD" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 theme-text-secondary text-xs">Loading event map...</div>}>
      <EventDetailContent />
    </Suspense>
  );
}
