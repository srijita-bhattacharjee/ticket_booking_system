'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { eventService } from '../services/api';
import {
  Ticket,
  Music,
  Film,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
  Star,
  Play,
  Heart,
  Headphones,
  CheckCircle2,
  Lock,
  ChevronRight,
  Calendar,
  MapPin,
  Trophy,
  Palette,
  Mic,
} from 'lucide-react';

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventService.getAll();
      setEvents(res.data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = selectedCategory === 'ALL'
    ? events
    : events.filter(e => e.eventType === selectedCategory);

  const featuredEvent = events[0] || {
    id: 'featured-1',
    title: 'Arijit Singh Live in Concert',
    eventType: 'CONCERT',
    eventDate: new Date('2025-08-24'),
    startTime: '19:00',
    venue: { name: 'DY Patil Stadium', city: 'Mumbai' },
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ========================================================================= */}
      {/* 1. STAGE HERO BANNER (TicketBay / TicketVerse Style)                    */}
      {/* ========================================================================= */}
      <section className="relative rounded-3xl overflow-hidden hero-stage-bg border theme-border shadow-2xl p-6 sm:p-12 lg:p-14">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold tracking-wider uppercase backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>LIVE IN CONCERT</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Feel the Music. <br />
              <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Live the Moment.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-white max-w-xl font-medium leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              From electrifying concerts to blockbusters — book your seats to the best experiences with real-time seat maps and instant 10-minute hold reservation locks.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <Link
                href="/events"
                className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-extrabold px-6 py-3.5 rounded-full text-xs sm:text-sm shadow-xl flex items-center gap-2 transition transform hover:-translate-y-0.5"
              >
                <span>Explore Events</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3 Trust Badges below Hero */}
            <div className="pt-6 border-t border-gray-700/60 grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-pink-500/40 border border-pink-400/60 flex items-center justify-center text-pink-300 shrink-0 shadow-md">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">Easy Booking</h4>
                  <p className="text-[10px] text-gray-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">Fast &amp; hassle-free</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-500/40 border border-orange-400/60 flex items-center justify-center text-orange-300 shrink-0 shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">Secure Payments</h4>
                  <p className="text-[10px] text-gray-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">100% safe checkout</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-500/40 border border-purple-400/60 flex items-center justify-center text-purple-300 shrink-0 shadow-md">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">24/7 Support</h4>
                  <p className="text-[10px] text-gray-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">We&apos;re here for you</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Spotlight Concert Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm rounded-3xl overflow-hidden bg-gray-900/85 border border-purple-500/30 shadow-2xl backdrop-blur-xl group hover:border-pink-500/50 transition duration-300">
              <div className="relative h-64 w-full">
                <Image
                  src={featuredEvent.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'}
                  alt={featuredEvent.title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />
                
                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-pink-300 text-[10px] font-mono font-extrabold px-3 py-1 rounded-full border border-pink-500/30">
                  LIVE IN MUMBAI
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white italic tracking-wide">
                    {featuredEvent.title}
                  </h3>
                  <p className="text-xs text-pink-400 font-serif italic">Live in Concert</p>
                </div>

                <div className="space-y-1.5 text-xs text-gray-300 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>24 Aug, 2025</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span>{featuredEvent.venue?.name || 'DY Patil Stadium'}, {featuredEvent.venue?.city || 'Mumbai'}</span>
                  </div>
                </div>

                <Link
                  href={`/events/${featuredEvent.id}`}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <span>Book Now</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. BROWSE BY CATEGORY SECTION                                           */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black theme-text-main">Browse by Category</h2>
          <Link href="/events" className="text-xs font-bold theme-text-accent hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Movies */}
          <Link
            href="/events?type=MOVIE"
            className="category-card-movies rounded-2xl p-4 text-white shadow-lg hover:scale-[1.03] transition duration-200 flex items-center justify-between group"
          >
            <div>
              <Film className="w-6 h-6 text-pink-300 mb-1" />
              <span className="text-sm font-extrabold block">Movies</span>
            </div>
            <ChevronRight className="w-4 h-4 text-pink-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>

          {/* Concerts */}
          <Link
            href="/events?type=CONCERT"
            className="category-card-concerts rounded-2xl p-4 text-white shadow-lg hover:scale-[1.03] transition duration-200 flex items-center justify-between group"
          >
            <div>
              <Music className="w-6 h-6 text-purple-300 mb-1" />
              <span className="text-sm font-extrabold block">Concerts</span>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>

          {/* Plays */}
          <Link
            href="/events?type=THEATRE"
            className="category-card-plays rounded-2xl p-4 text-white shadow-lg hover:scale-[1.03] transition duration-200 flex items-center justify-between group"
          >
            <div>
              <Sparkles className="w-6 h-6 text-amber-300 mb-1" />
              <span className="text-sm font-extrabold block">Plays</span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>

          {/* Sports */}
          <Link
            href="/events?type=SPORTS"
            className="category-card-sports rounded-2xl p-4 text-white shadow-lg hover:scale-[1.03] transition duration-200 flex items-center justify-between group"
          >
            <div>
              <Trophy className="w-6 h-6 text-emerald-300 mb-1" />
              <span className="text-sm font-extrabold block">Sports</span>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>

          {/* Comedy */}
          <Link
            href="/events?type=COMEDY"
            className="category-card-comedy rounded-2xl p-4 text-white shadow-lg hover:scale-[1.03] transition duration-200 flex items-center justify-between group"
          >
            <div>
              <Mic className="w-6 h-6 text-fuchsia-300 mb-1" />
              <span className="text-sm font-extrabold block">Comedy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-fuchsia-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>

          {/* Workshops */}
          <Link
            href="/events?type=WORKSHOP"
            className="category-card-workshops rounded-2xl p-4 text-white shadow-lg hover:scale-[1.03] transition duration-200 flex items-center justify-between group"
          >
            <div>
              <Palette className="w-6 h-6 text-teal-300 mb-1" />
              <span className="text-sm font-extrabold block">Workshops</span>
            </div>
            <ChevronRight className="w-4 h-4 text-teal-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. 🔥 TRENDING NOW SECTION                                              */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h2 className="text-xl font-black theme-text-main">Trending Now</h2>
          </div>
          <Link href="/events" className="text-xs font-bold theme-text-accent hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {events.slice(0, 4).map((evt, idx) => (
            <div
              key={evt.id}
              className="theme-bg-card theme-border border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={evt.imageUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80'}
                    alt={evt.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />

                  {/* Date Badge Overlay */}
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-white px-2.5 py-1 rounded-xl border border-white/10 text-center leading-none">
                    <span className="text-xs font-black block">
                      {new Date(evt.eventDate).getDate() || (23 + idx)}
                    </span>
                    <span className="text-[9px] font-bold text-pink-400 uppercase block mt-0.5">
                      {new Date(evt.eventDate).toLocaleString('default', { month: 'short' }) || 'AUG'}
                    </span>
                  </div>

                  {/* Wishlist Heart Icon */}
                  <button
                    type="button"
                    onClick={() => alert('Added to wishlist!')}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition"
                  >
                    <Heart className="w-3.5 h-3.5 hover:text-pink-500" />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-extrabold text-sm theme-text-main line-clamp-1 group-hover:theme-text-accent transition">
                    {evt.title}
                  </h3>

                  <p className="text-[11px] theme-text-secondary font-medium flex items-center justify-between">
                    <span>{evt.eventType || 'Concert'} • {evt.venue?.city || 'Mumbai'}</span>
                    <span className="flex items-center gap-1 theme-text-accent font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      4.8
                    </span>
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 border-t theme-border flex items-center justify-between">
                <div>
                  <span className="text-[9px] theme-text-secondary uppercase block font-bold">From</span>
                  <span className="text-sm font-black theme-text-main">
                    ₹{evt.startingPrice ?? evt.eventSeats?.[0]?.price ?? 15}
                  </span>
                </div>

                <Link
                  href={`/events/${evt.id}`}
                  className="theme-btn-primary font-extrabold px-3.5 py-1.5 rounded-xl text-xs shadow-md transition flex items-center gap-1"
                >
                  <span>Book</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PROMO DISCOUNT BANNER BAR                                            */}
      {/* ========================================================================= */}
      <section className="promo-banner-bg rounded-3xl p-6 sm:p-8 text-white border border-purple-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-2xl shrink-0">
            🍿
          </div>
          <div>
            <h3 className="text-xl font-black">
              Get <span className="text-yellow-400">10% Off</span> on your first booking!
            </h3>
            <p className="text-xs text-gray-300 mt-0.5">
              Enjoy gourmet popcorn & cinema snacks on every ticket reservation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 rounded-xl bg-black/40 border border-dashed border-pink-400 text-xs font-mono font-bold text-pink-300">
            Use Code: <span className="text-white font-black">FIRST10</span>
          </div>

          <Link
            href="/events"
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-950 font-black px-6 py-2.5 rounded-full text-xs shadow-lg transition"
          >
            Book Now →
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PLATFORM FEATURES OVERVIEW                                           */}
      {/* ========================================================================= */}
      <section className="theme-bg-card theme-border border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b theme-border pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest theme-text-accent">
              Platform Features
            </span>
            <h3 className="text-xl font-black theme-text-main">Designed for Unforgettable Live Experiences</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer */}
          <div className="p-4 rounded-2xl theme-bg-elevated theme-border border space-y-2">
            <span className="text-xs font-mono font-bold theme-text-accent block uppercase">Customer Experience</span>
            <h4 className="text-sm font-bold theme-text-main">Instant Seat Reservations & Checkout</h4>
            <p className="text-xs theme-text-secondary">
              Interactive seat selection maps, instant 10-minute hold locks, gourmet food combo add-ons, and digital QR tickets.
            </p>
          </div>

          {/* Organiser */}
          <div className="p-4 rounded-2xl theme-bg-elevated theme-border border space-y-2">
            <span className="text-xs font-mono font-bold text-purple-400 block uppercase">Organiser Portal</span>
            <h4 className="text-sm font-bold theme-text-main">Event Management & Partner Offers</h4>
            <p className="text-xs theme-text-secondary">
              Publish live event listings, tiered seat pricing, food stall combo offers, and real-time sales analytics.
            </p>
          </div>

          {/* Admin */}
          <div className="p-4 rounded-2xl theme-bg-elevated theme-border border space-y-2">
            <span className="text-xs font-mono font-bold text-emerald-400 block uppercase">Admin Operations</span>
            <h4 className="text-sm font-bold theme-text-main">Venue Builder & Verification</h4>
            <p className="text-xs theme-text-secondary">
              Configure venue row/seat layouts, capacity controls, food partner verifications, and platform governance.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
