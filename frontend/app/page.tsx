'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { eventService } from '../services/api';
import TicketStub3D from '../components/TicketStub3D';
import { Ticket, Film, Music, ShieldCheck, Zap, RefreshCw, Sparkles, ArrowRight, Star, Gift, Lock, CheckCircle2, UserCheck, LayoutDashboard, Shield } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Ticket Tier State
  const [selectedTier, setSelectedTier] = useState<'GENERAL' | 'VIP' | 'BACKSTAGE'>('VIP');
  const [tierPrice, setTierPrice] = useState<number>(85);

  useEffect(() => {
    setMounted(true);
    eventService
      .getAll()
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectTier = (tier: string, price: number) => {
    setSelectedTier(tier as any);
    setTierPrice(price);
  };

  const featuredEvent = events[0] || {
    id: 'sample-1',
    title: 'Coldplay — Music of the Spheres',
    eventDate: '2026-09-15T20:00:00.000Z',
    startTime: '20:00',
    venue: { name: 'Metropolitan Arena', location: 'Main Stadium' },
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  };

  const formattedDate = mounted ? new Date(featuredEvent.eventDate).toLocaleDateString() : 'Sep 15, 2026';

  return (
    <div className="space-y-16 py-4 relative">
      {/* Hero Banner with Spinning Vinyl ALL ACCESS Stamp & Drifting Shapes */}
      <section className="relative overflow-hidden rounded-3xl theme-bg-card theme-border border-2 shadow-2xl p-8 sm:p-14">
        {/* Background Live Concert Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80"
            alt="Live Stage Hero"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />
        </div>

        {/* Orbiting Drifting Floating Shapes */}
        <div className="absolute top-10 left-10 w-16 h-16 rounded-full border-2 border-[#FF6847]/30 animate-orbit pointer-events-none" />
        <div className="absolute bottom-12 right-1/3 w-12 h-12 border-2 border-amber-500/30 rotate-45 animate-float-slow pointer-events-none" />
        <div className="absolute top-20 right-16 w-8 h-8 rounded border-2 border-emerald-400/30 animate-orbit pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Content with Glitch Headline */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full theme-bg-elevated theme-border border theme-text-accent text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-[#FF6847] animate-ping" />
              <span>LIVE TICKETING ENGINE • ZERO RACE CONDITIONS</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight theme-text-main uppercase leading-none animate-glitch">
              EXPERIENCE <br />
              <span className="theme-text-accent bg-clip-text">EVERY MOMENT</span>
            </h1>

            <p className="theme-text-secondary text-sm sm:text-base max-w-xl font-medium leading-relaxed">
              Book tickets for movies, concerts and live events near you with zero race conditions, 10-minute hold TTLs, instant QR codes, and gourmet food combos.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/events"
                className="theme-btn-primary font-extrabold px-7 py-3.5 rounded-xl transition flex items-center gap-2 shadow-xl text-sm"
              >
                Explore Events
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/offers"
                className="theme-btn-secondary font-bold px-6 py-3.5 rounded-xl transition text-sm flex items-center gap-2"
              >
                <Gift className="w-4 h-4 theme-text-accent" />
                View Offers
              </Link>
            </div>
          </div>

          {/* Right Floating Spotlight Card & Spinning Vinyl ALL ACCESS Stamp */}
          <div className="lg:col-span-5 relative">
            {/* Spinning "ALL ACCESS" VIP Vinyl Circular Stamp */}
            <div className="absolute -top-10 -right-6 z-20 w-28 h-28 pointer-events-none animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#FF6847] fill-current">
                <path
                  id="circlePath"
                  d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  fill="none"
                />
                <text className="text-[9.5px] font-mono font-extrabold uppercase tracking-widest fill-current">
                  <textPath href="#circlePath">
                    ★ ALL ACCESS ★ VIP PASS ★ TICKETVERSE ★
                  </textPath>
                </text>
              </svg>
            </div>

            <div className="theme-bg-card theme-border border-2 rounded-3xl p-5 shadow-2xl backdrop-blur-md space-y-4">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest theme-text-accent flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> SPOTLIGHT SHOW
              </span>

              <div className="relative h-44 rounded-2xl overflow-hidden theme-bg-main border theme-border">
                <img
                  src={featuredEvent.imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80'}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-mono font-bold text-white uppercase bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded border border-white/20">
                  Featured
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold theme-text-main line-clamp-1">{featuredEvent.title}</h3>
                <p className="text-xs theme-text-secondary flex items-center gap-1.5 font-mono" suppressHydrationWarning>
                  📍 {featuredEvent.venue?.name} • 📅 {formattedDate}
                </p>
              </div>

              <Link
                href={`/events/${featuredEvent.id}`}
                className="w-full theme-btn-primary font-extrabold py-3 rounded-xl transition text-xs text-center block shadow-md"
              >
                Book Tickets
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Role Services Showcase Section */}
      <section className="space-y-6 border-t theme-border pt-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider font-extrabold theme-text-accent px-3 py-1 rounded-full theme-bg-elevated theme-border border font-mono">
            Platform Capabilities
          </span>
          <h2 className="text-3xl font-extrabold theme-text-main">Services for All User Roles</h2>
          <p className="text-xs theme-text-secondary">Explore dedicated tools tailored specifically for Customers, Event Organisers, and System Administrators.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          {/* Customer Services */}
          <div className="theme-bg-card theme-border border-2 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b theme-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl theme-bg-elevated theme-border border theme-text-accent">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold theme-text-main">Customer Services</h3>
                    <p className="text-[11px] theme-text-secondary">Ticket Buyers & Moviegoers</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 text-xs theme-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Visual interactive seat selection & 10-minute atomic hold locks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Food combos, gourmet popcorn & beverage add-ons during checkout</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Redeem food partner discount coupons (<code className="theme-text-accent font-mono font-bold">POPCORN15</code>, <code className="theme-text-accent font-mono font-bold">FEAST5</code>)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Automated category waitlists with instant FIFO re-allocation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Digital HMAC-signed QR Code E-Tickets & email delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Order history dashboard, digital ticket viewing & booking cancellation</span>
                </li>
              </ul>
            </div>

            <Link
              href="/events"
              className="w-full theme-btn-primary font-bold py-3 rounded-xl transition text-xs text-center shadow-md block"
            >
              Explore Customer Portal & Events
            </Link>
          </div>

          {/* Organiser Services */}
          <div className="theme-bg-card theme-border border-2 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b theme-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl theme-bg-elevated theme-border border theme-text-accent">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold theme-text-main">Organiser Services</h3>
                    <p className="text-[11px] theme-text-secondary">Event Managers & Concert Hosts</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 text-xs theme-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Host & publish Movies and Concert listings with tiered seat pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Upload Proof of Partnership contract documents with food chains</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Issue partner food discount vouchers and event promo coupons</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Track total revenue, tickets sold, and seat occupancy percentages</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Real-time WebSocket seat status monitors & occupancy heatmaps</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Link
                href="/organiser/dashboard"
                className="w-full theme-btn-primary font-bold py-3 rounded-xl transition text-xs text-center shadow-md block"
              >
                Organiser Dashboard
              </Link>
              <Link
                href="/organiser/coupons"
                className="w-full theme-btn-secondary font-bold py-2.5 rounded-xl transition text-xs text-center block"
              >
                Food Partnerships & Coupons Hub
              </Link>
            </div>
          </div>

          {/* Admin Services */}
          <div className="theme-bg-card theme-border border-2 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b theme-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl theme-bg-elevated theme-border border theme-text-accent">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold theme-text-main">Admin Services</h3>
                    <p className="text-[11px] theme-text-secondary">System Administrators</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 text-xs theme-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Build venue seat grid layouts, row counts, and seat category tiers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Configure food stalls, snack counters, prices, and combo menus</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Inspect, approve, or reject Organiser Proof of Partnership submissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 theme-text-success shrink-0 mt-0.5" />
                  <span>Manage global platform settings, cinema halls, and venue photo covers</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Link
                href="/admin/venues"
                className="w-full theme-btn-primary font-bold py-3 rounded-xl transition text-xs text-center shadow-md block"
              >
                Admin Venues Layout Builder
              </Link>
              <Link
                href="/admin/food"
                className="w-full theme-btn-secondary font-bold py-2.5 rounded-xl transition text-xs text-center block"
              >
                Food Stalls & Partnerships Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Perforated 3D Ticket Stubs Tier Selector */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-mono font-extrabold uppercase theme-text-accent px-3 py-1 rounded-full theme-bg-elevated theme-border border">
            SELECT TICKET TIER
          </span>
          <h2 className="text-3xl font-extrabold theme-text-main">Perforated 3D Ticket Stubs</h2>
          <p className="text-xs theme-text-secondary">Hover to tilt and reveal sweeping metallic sheen effect</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TicketStub3D
            event={featuredEvent}
            tier="GENERAL"
            onSelectTier={handleSelectTier}
          />
          <TicketStub3D
            event={featuredEvent}
            tier="VIP"
            onSelectTier={handleSelectTier}
          />
          <TicketStub3D
            event={featuredEvent}
            tier="BACKSTAGE"
            onSelectTier={handleSelectTier}
          />
        </div>
      </section>

      {/* Top Picks For You Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold theme-text-main">Top Picks For You</h2>
            <p className="text-xs theme-text-secondary">Handpicked trending movies, live concerts & shows</p>
          </div>
          <Link href="/events" className="text-xs font-extrabold theme-text-accent hover:underline flex items-center gap-1 font-mono">
            See All &gt;
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 theme-text-secondary text-xs">Loading catalog...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((ev, idx) => {
              const displayImage = ev.imageUrl || ev.venue?.imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80';
              const rating = (8.5 + (idx % 10) * 0.2).toFixed(1);
              return (
                <div
                  key={ev.id}
                  className="group theme-bg-card theme-border border rounded-2xl overflow-hidden transition shadow-lg flex flex-col justify-between"
                >
                  <div className="h-52 w-full relative theme-bg-main overflow-hidden">
                    <img
                      src={displayImage}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <span className="absolute top-3 left-3 text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded theme-btn-primary">
                      {ev.eventType}
                    </span>

                    <span className="absolute top-3 right-3 text-[11px] font-mono font-bold text-amber-400 bg-black/70 px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md border border-amber-400/30">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {rating}
                    </span>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold theme-text-main group-hover:theme-text-accent transition line-clamp-1">
                        {ev.title}
                      </h3>
                      <p className="text-[11px] theme-text-secondary line-clamp-1">{ev.venue?.name} • {ev.venue?.location}</p>
                    </div>

                    <div className="pt-2 border-t theme-border flex items-center justify-between text-xs">
                      <span className="text-[11px] theme-text-success font-mono font-bold">
                        {ev.isSoldOut ? 'Sold Out' : `${ev.availableSeats} Available`}
                      </span>

                      <Link
                        href={`/events/${ev.id}`}
                        className="theme-btn-primary font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
                      >
                        Book Seats
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
