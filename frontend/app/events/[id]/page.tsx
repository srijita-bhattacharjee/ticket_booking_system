'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { eventService, holdService, waitlistService, wishlistService } from '../../../services/api';
import SeatMap from '../../../components/SeatMap';
import WaitlistCard from '../../../components/WaitlistCard';
import TrailerModal from '../../../components/TrailerModal';
import {
  Ticket,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  Play,
  Users,
  Layers,
  Award,
  CreditCard,
  Building,
  Heart,
} from 'lucide-react';

function EventDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerToken = searchParams.get('offerToken');

  const eventId = params.id as string;
  const [event, setEvent] = useState<any>(null);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  
  // Non-seat resource selections
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedPass, setSelectedPass] = useState<any>(null);
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [error, setError] = useState('');
  const [offerSuccess, setOfferSuccess] = useState('');
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    if (eventId) {
      eventService
        .getOne(eventId)
        .then((res) => {
          setEvent(res.data);
          // Set default resource selections if applicable
          const cfg = res.data.resourceConfig;
          if (cfg?.zones?.length > 0) setSelectedZone(cfg.zones[0]);
          if (cfg?.slots?.length > 0) setSelectedSlot(cfg.slots[0]);
          if (cfg?.tables?.length > 0) setSelectedTable(cfg.tables[0]);
          if (cfg?.passes?.length > 0) setSelectedPass(cfg.passes[0]);
        })
        .catch(() => setError('Failed to load event details'))
        .finally(() => setLoading(false));

      if (typeof window !== 'undefined' && localStorage.getItem('token')) {
        wishlistService
          .getIds()
          .then((res) => setIsWishlisted(res.data.includes(eventId)))
          .catch(() => {});
      }
    }
  }, [eventId]);

  const handleWishlistToggle = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login?redirect=' + encodeURIComponent(`/events/${eventId}`));
      return;
    }

    setIsWishlisted((prev) => !prev);
    try {
      await wishlistService.toggle(eventId);
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
    }
  };

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
  
  // Calculate total price based on booking model
  let totalPrice = 0;
  if (event?.seats && event.seats.length > 0) {
    totalPrice = selectedSeatsDetails.reduce((sum: number, s: any) => sum + s.price, 0);
  } else if (selectedZone) {
    totalPrice = (selectedZone.price || 0) * ticketQuantity;
  } else if (selectedSlot) {
    totalPrice = (selectedSlot.pricePerPerson || 0) * ticketQuantity;
  } else if (selectedTable) {
    totalPrice = selectedTable.price || 0;
  } else if (selectedPass) {
    totalPrice = (selectedPass.price || 0) * ticketQuantity;
  } else if (event?.bookingModel === 'TEAM') {
    totalPrice = event.resourceConfig?.team?.registrationFee || 2500;
  } else if (event?.bookingModel === 'CAPACITY') {
    totalPrice = 500 * ticketQuantity;
  }

  const handleHoldAndProceed = async () => {
    setHolding(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=' + encodeURIComponent(`/events/${eventId}`));
        return;
      }

      if (event?.seats && event.seats.length > 0) {
        // Seat-map based booking (SEAT model)
        if (selectedSeatIds.length === 0) {
          setError('Please select at least one seat to proceed.');
          setHolding(false);
          return;
        }
        const res = await holdService.create(eventId, selectedSeatIds);
        router.push(`/checkout/${res.data.holdId}`);
      } else {
        // Non-seat-map events: Zones, Slots, Capacity, Team, Pass, General Admission
        // Pick the first N available event seats from the event's seat pool
        const qty = ticketQuantity || 1;
        const availableSeats = (event?.seats || [])
          .filter((s: any) => s.status === 'AVAILABLE')
          .slice(0, qty);

        if (availableSeats.length > 0) {
          const seatIds = availableSeats.map((s: any) => s.id);
          const res = await holdService.create(eventId, seatIds);
          router.push(`/checkout/${res.data.holdId}`);
        } else {
          // Re-fetch event to get freshest seats (event detail page may not have full seat list)
          try {
            const freshEvent = await eventService.getOne(eventId);
            const freshSeats = freshEvent.data?.seats || [];
            const freshAvailable = freshSeats.filter((s: any) => s.status === 'AVAILABLE').slice(0, qty);
            if (freshAvailable.length > 0) {
              const res = await holdService.create(eventId, freshAvailable.map((s: any) => s.id));
              router.push(`/checkout/${res.data.holdId}`);
            } else {
              setError('No seats are currently available for this event. You may join the waitlist.');
            }
          } catch {
            setError('Could not load available seats. Please refresh and try again.');
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place reservation hold');
    } finally {
      setHolding(false);
    }
  };


  if (loading) return <div className="text-center py-20 theme-text-secondary text-xs">Loading event map &amp; resources...</div>;
  if (!event) return <div className="text-center py-20 theme-text-secondary text-xs">Event not found</div>;

  const displayImage = event.imageUrl || event.venue?.imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80';
  const hasSeats = event.seats && event.seats.length > 0;
  const resourceConfig = event.resourceConfig || {};

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
              A previously held seat has been allocated to you. Click claim to proceed to checkout before the offer expires.
            </p>
          </div>
          <button
            onClick={handleAcceptWaitlistOffer}
            className="theme-btn-primary font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition"
          >
            Claim Reserved Offer
          </button>
        </div>
      )}

      {offerSuccess && (
        <div className="theme-bg-elevated theme-border border rounded-xl p-4 flex items-center gap-2 theme-text-success text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{offerSuccess} Redirecting to checkout...</span>
        </div>
      )}

      {/* Hero Event Banner */}
      <div className="relative rounded-3xl overflow-hidden theme-border border shadow-2xl theme-bg-card">
        <div className="h-64 sm:h-80 w-full relative overflow-hidden">
          <img src={displayImage} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        <div className="p-6 sm:p-8 -mt-20 relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full theme-bg-elevated theme-border border theme-text-accent">
                  {event.activityType || event.eventType}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full theme-bg-elevated theme-border border text-purple-400">
                  Model: {event.bookingModel || 'SEAT'}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {event.status || 'ON_SALE'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{event.title}</h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{event.description}</p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-400">
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

                {(event.eventType === 'MOVIE' || event.trailerUrl) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsTrailerOpen(true)}
                      className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-lg transition transform hover:scale-105"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Watch Trailer 🎬</span>
                    </button>

                    <TrailerModal
                      isOpen={isTrailerOpen}
                      onClose={() => setIsTrailerOpen(false)}
                      trailerUrl={event.trailerUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
                      title={`${event.title} — Official Trailer`}
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition ${
                    isWishlisted
                      ? 'bg-pink-950/60 border-pink-500 text-pink-300 shadow-md'
                      : 'theme-bg-elevated theme-border theme-text-main hover:theme-bg-card'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-pink-500 text-pink-500' : 'theme-text-secondary'}`} />
                  <span>{isWishlisted ? 'Saved to Wishlist ❤️' : 'Add to Wishlist'}</span>
                </button>
              </div>
            </div>

            <div className="theme-bg-card p-4 rounded-2xl theme-border border text-right space-y-1 shrink-0">
              <span className="text-[10px] theme-text-secondary uppercase font-bold tracking-wider">Pricing Starting From</span>
              <div className="text-sm font-extrabold theme-text-accent">
                ₹{event.seats?.find((s: any) => s.category === 'STANDARD')?.price || selectedZone?.price || selectedSlot?.pricePerPerson || selectedTable?.price || 300}
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
        
        {/* Left Interactive Resource Selector */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Mode 1: SEAT Layout Grid */}
          {hasSeats ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold theme-text-main flex items-center gap-2">
                  <Ticket className="w-5 h-5 theme-text-accent" /> Visual Interactive Seat Map
                </h3>
                <span className="text-xs theme-text-secondary">Click any available seat to select</span>
              </div>

              <SeatMap
                eventId={eventId}
                seats={event.seats || []}
                selectedSeatIds={selectedSeatIds}
                onSeatToggle={toggleSeat}
              />
            </>
          ) : (
            /* Mode 2: Non-Seat Resource Selection Interfaces */
            <div className="space-y-6">
              
              {/* Standing Zones / General Admission */}
              {resourceConfig.zones && resourceConfig.zones.length > 0 && (
                <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold theme-text-main flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" /> Standing Zones &amp; Capacity Tiers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resourceConfig.zones.map((z: any) => {
                      const isSel = selectedZone?.id === z.id;
                      return (
                        <div
                          key={z.id}
                          onClick={() => setSelectedZone(z)}
                          className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                            isSel
                              ? 'theme-bg-elevated border-purple-500 ring-2 ring-purple-500/40'
                              : 'theme-bg-input theme-border hover:theme-bg-elevated'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold theme-text-main">{z.name}</h4>
                            {isSel && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                          </div>
                          <p className="text-xs theme-text-secondary">Entry Gate: {z.entryGate || 'Gate Main'}</p>
                          <div className="flex items-center justify-between pt-2 border-t theme-border text-xs font-bold">
                            <span className="theme-text-secondary">Capacity: {z.capacity} Spots</span>
                            <span className="theme-text-accent">₹{z.price}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timed Session Slots */}
              {resourceConfig.slots && resourceConfig.slots.length > 0 && (
                <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold theme-text-main flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" /> Timed Game / Activity Sessions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resourceConfig.slots.map((s: any) => {
                      const isSel = selectedSlot?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSlot(s)}
                          className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                            isSel
                              ? 'theme-bg-elevated border-purple-500 ring-2 ring-purple-500/40'
                              : 'theme-bg-input theme-border hover:theme-bg-elevated'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold theme-text-main">{s.startTime} – {s.endTime} ({s.durationMinutes}m)</h4>
                            {isSel && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                          </div>
                          <p className="text-xs theme-text-secondary">Max Players: {s.maxCapacity} per session</p>
                          <div className="flex items-center justify-between pt-2 border-t theme-border text-xs font-bold">
                            <span className="theme-text-secondary">Slot Session</span>
                            <span className="theme-text-accent">₹{s.pricePerPerson} / Person</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tables & Dining */}
              {resourceConfig.tables && resourceConfig.tables.length > 0 && (
                <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold theme-text-main flex items-center gap-2">
                    <Building className="w-5 h-5 text-amber-400" /> Table &amp; Dining Seating Layout
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resourceConfig.tables.map((t: any) => {
                      const isSel = selectedTable?.id === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTable(t)}
                          className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                            isSel
                              ? 'theme-bg-elevated border-purple-500 ring-2 ring-purple-500/40'
                              : 'theme-bg-input theme-border hover:theme-bg-elevated'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold theme-text-main">{t.name}</h4>
                            {isSel && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                          </div>
                          <p className="text-xs theme-text-secondary">Capacity: {t.capacity} Seats Table</p>
                          <div className="flex items-center justify-between pt-2 border-t theme-border text-xs font-bold">
                            <span className="theme-text-secondary">Full Table Reservation</span>
                            <span className="theme-text-accent">₹{t.price}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tournament Team Registration */}
              {event.bookingModel === 'TEAM' && (
                <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold theme-text-main flex items-center gap-2">
                    <Award className="w-5 h-5 text-orange-400" /> Squad &amp; Team Tournament Registration
                  </h3>
                  <div className="theme-bg-elevated p-4 rounded-xl border theme-border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold theme-text-main">Max Teams Allowed:</span>
                      <span className="theme-text-accent font-extrabold">{resourceConfig.team?.maxTeams || 16} Squads</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold theme-text-main">Squad Size Limits:</span>
                      <span className="theme-text-main">{resourceConfig.team?.minTeamSize || 5} to {resourceConfig.team?.maxTeamSize || 7} Players</span>
                    </div>
                    <div className="flex items-center justify-between border-t theme-border pt-2">
                      <span className="font-bold theme-text-main">Registration Entry Fee:</span>
                      <span className="theme-text-accent text-sm font-black">₹{resourceConfig.team?.registrationFee || 2500} / Team</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Passes & Badges */}
              {resourceConfig.passes && resourceConfig.passes.length > 0 && (
                <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold theme-text-main flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-pink-400" /> Delegate &amp; Visitor Pass Tiers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {resourceConfig.passes.map((p: any) => {
                      const isSel = selectedPass?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPass(p)}
                          className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                            isSel
                              ? 'theme-bg-elevated border-purple-500 ring-2 ring-purple-500/40'
                              : 'theme-bg-input theme-border hover:theme-bg-elevated'
                          }`}
                        >
                          <h4 className="text-xs font-bold theme-text-main">{p.name}</h4>
                          <p className="text-[11px] theme-text-secondary">{p.perks || 'Pass Entry'}</p>
                          <div className="pt-2 border-t theme-border text-xs font-black theme-text-accent">
                            ₹{p.price}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Seats / Resource Summary & Checkout Action */}
        <div className="space-y-6">
          <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold theme-text-main border-b theme-border pb-3 flex items-center gap-2">
              <Ticket className="w-5 h-5 theme-text-accent" />
              Booking Summary
            </h3>

            {hasSeats ? (
              selectedSeatIds.length === 0 ? (
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
                        <span className="font-bold theme-text-main">₹{seat.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t theme-border pt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold theme-text-secondary">Total Price</span>
                    <span className="text-2xl font-extrabold theme-text-accent">₹{totalPrice.toFixed(2)}</span>
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
              )
            ) : (
              /* Non-seat Resource Summary */
              <div className="space-y-4">
                <div className="theme-bg-elevated p-3 rounded-xl border theme-border space-y-1 text-xs">
                  <p className="font-bold theme-text-main">
                    {selectedZone?.name || selectedSlot?.startTime || selectedTable?.name || selectedPass?.name || event.title}
                  </p>
                  <p className="theme-text-secondary">Resource Category: {event.bookingModel}</p>
                </div>

                {!selectedTable && event.bookingModel !== 'TEAM' && (
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="theme-text-secondary">Quantity / Spots:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                        className="w-7 h-7 rounded-lg theme-bg-elevated border theme-border font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="theme-text-main font-bold">{ticketQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setTicketQuantity(ticketQuantity + 1)}
                        className="w-7 h-7 rounded-lg theme-bg-elevated border theme-border font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t theme-border pt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold theme-text-secondary">Total Price</span>
                  <span className="text-2xl font-extrabold theme-text-accent">₹{totalPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleHoldAndProceed}
                  disabled={holding}
                  className="w-full theme-btn-primary font-bold py-3 rounded-xl transition text-sm shadow-md"
                >
                  {holding ? 'Reserving Spots...' : 'Reserve Spot & Proceed to Checkout'}
                </button>
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
