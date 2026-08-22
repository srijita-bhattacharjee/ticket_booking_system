'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { eventService } from '../../services/api';
import { Search, Film, Music, Ticket, MapPin, Calendar } from 'lucide-react';

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
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-extrabold theme-text-main">Event & Movie Listings</h1>
        <p className="text-sm theme-text-secondary">Explore showtimes, visual seat maps, cover photos, and tiered pricing</p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 theme-bg-card theme-border border p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              typeFilter === '' ? 'theme-btn-primary' : 'theme-btn-secondary'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setTypeFilter('MOVIE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === 'MOVIE' ? 'theme-btn-primary' : 'theme-btn-secondary'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Movies
          </button>
          <button
            onClick={() => setTypeFilter('CONCERT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === 'CONCERT' ? 'theme-btn-primary' : 'theme-btn-secondary'
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
            className="w-full theme-bg-input theme-border border rounded-xl px-4 py-2 text-xs theme-text-main focus:outline-none pr-10"
          />
          <button type="submit" className="absolute right-3 top-2.5 theme-text-secondary hover:theme-text-accent">
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="text-center py-16 theme-text-secondary text-xs">Loading catalog...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 theme-text-secondary theme-bg-card theme-border border rounded-2xl text-xs">
          No matching events found. Try adjusting your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev) => {
            const displayImage = ev.imageUrl || ev.venue?.imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80';
            return (
              <div
                key={ev.id}
                className="theme-bg-card theme-border border rounded-2xl overflow-hidden transition shadow-xl flex flex-col justify-between group"
              >
                {/* Cover Image Banner */}
                <div className="h-48 w-full relative theme-bg-main overflow-hidden">
                  <img
                    src={displayImage}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs uppercase px-2.5 py-1 rounded-full font-bold flex items-center gap-1 theme-btn-primary backdrop-blur-md">
                      {ev.eventType === 'MOVIE' ? <Film className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
                      {ev.eventType}
                    </span>

                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full theme-badge-success">
                      {ev.isSoldOut ? 'Sold Out (Waitlist Open)' : `${ev.availableSeats} / ${ev.totalSeats} Seats Available`}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold theme-text-main group-hover:theme-text-accent transition">{ev.title}</h3>
                    <p className="text-xs theme-text-secondary line-clamp-2">{ev.description}</p>
                  </div>

                  <div className="pt-4 border-t theme-border flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <p className="theme-text-secondary flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 theme-text-accent" />
                        <span className="theme-text-main font-medium">{ev.venue?.name}</span>
                      </p>
                      <p className="theme-text-secondary flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 theme-text-accent" />
                        <span className="theme-text-main font-medium">{new Date(ev.eventDate).toLocaleDateString()} at {ev.startTime}</span>
                      </p>
                    </div>

                    <Link
                      href={`/events/${ev.id}`}
                      className="theme-btn-primary font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1 shadow-md"
                    >
                      View Seats
                      <Ticket className="w-4 h-4 text-white" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
