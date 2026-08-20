'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { eventService } from '../services/api';
import { Ticket, Film, Music, ShieldCheck, Zap, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService
      .getAll()
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-[#0b0f19] border border-slate-800 p-8 sm:p-14 text-center">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-sky-500/20 via-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none rounded-full" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen High Demand Booking Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
            Book Live Events & Movies With Zero Race Conditions
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Experience real-time seat availability, 10-minute automated hold TTLs, instant QR code email delivery, and intelligent waitlist auto-assignment.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/events"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-lg shadow-sky-500/25"
            >
              Browse Event Catalog
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl border border-slate-700 transition"
            >
              Role Access & Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="p-3 w-fit rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">10-Minute Hold TTL</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Selected seats are held atomically in Redis and PostgreSQL. Abandoned checkouts are auto-released instantly via WebSockets.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Smart Waitlist Reallocation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cancelled tickets trigger automated FIFO category offers with 15-minute time-limited claim links sent straight to waiting users.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Cryptographic QR Tickets</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every confirmed booking dispatches an email with a secure QR code ticket for venue check-in verification.
          </p>
        </div>
      </section>

      {/* Featured Events Listing */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Featured Shows & Movies</h2>
            <p className="text-xs text-slate-400">Select an event to open the visual interactive seat map</p>
          </div>
          <Link href="/events" className="text-sm font-semibold text-sky-400 hover:underline">
            View All ({events.length})
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading catalog...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="group bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs uppercase px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                        ev.eventType === 'MOVIE'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}
                    >
                      {ev.eventType === 'MOVIE' ? <Film className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
                      {ev.eventType}
                    </span>

                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        ev.isSoldOut
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {ev.isSoldOut ? 'Sold Out (Waitlist Open)' : `${ev.availableSeats} Seats Available`}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">{ev.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-slate-400">Venue: <span className="text-slate-200 font-medium">{ev.venue?.name}</span></p>
                    <p className="text-slate-400">Date: <span className="text-slate-200 font-medium">{new Date(ev.eventDate).toLocaleDateString()} at {ev.startTime}</span></p>
                  </div>

                  <Link
                    href={`/events/${ev.id}`}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition flex items-center gap-1"
                  >
                    Select Seats
                    <Ticket className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
