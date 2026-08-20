'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { eventService } from '../../services/api';
import { Search, Film, Music, Ticket } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchEvents = () => {
    setLoading(true);
    eventService
      .getAll(typeFilter || undefined, searchQuery || undefined)
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Event & Movie Listings</h1>
        <p className="text-sm text-slate-400">Explore showtimes, visual seat maps, and tiered pricing</p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              typeFilter === '' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setTypeFilter('MOVIE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === 'MOVIE' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Movies
          </button>
          <button
            onClick={() => setTypeFilter('CONCERT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === 'CONCERT' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Concerts
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search titles or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 pr-10"
          />
          <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-sky-400">
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading catalog...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl">
          No matching events found. Try adjusting your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 transition flex flex-col justify-between"
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
                    {ev.isSoldOut ? 'Sold Out (Waitlist Open)' : `${ev.availableSeats} / ${ev.totalSeats} Seats Available`}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white">{ev.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{ev.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-400">Venue: <span className="text-slate-200 font-medium">{ev.venue?.name}</span></p>
                  <p className="text-slate-400">Date: <span className="text-slate-200 font-medium">{new Date(ev.eventDate).toLocaleDateString()} at {ev.startTime}</span></p>
                </div>

                <Link
                  href={`/events/${ev.id}`}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition flex items-center gap-1 shadow-lg shadow-sky-500/20"
                >
                  View Seats
                  <Ticket className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
