'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { eventService } from '../../services/api';
import { Film, Music, Sparkles, Trophy, Mic, Palette, MapPin, Calendar, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') || '';
  const searchParam = searchParams.get('search') || '';

  const [events, setEvents] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>(typeParam);
  const [searchQuery, setSearchQuery] = useState<string>(searchParam);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTypeFilter(searchParams.get('type') || '');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    eventService
      .getAll(typeFilter || undefined, searchQuery || undefined)
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [typeFilter, searchQuery]);

  const handleCategorySelect = (type: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (searchQuery) params.set('search', searchQuery);
    router.push(`/events${params.toString() ? '?' + params.toString() : ''}`);
  };

  const clearSearch = () => {
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    router.push(`/events${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-extrabold theme-text-main">Events &amp; Shows Catalog</h1>
        <p className="text-sm theme-text-secondary">
          Explore movies, concerts, plays, live sports, comedy shows, and masterclass workshops
        </p>
      </div>

      {/* Active Search Badge */}
      {searchQuery && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs theme-text-secondary">Showing results for:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
            &ldquo;{searchQuery}&rdquo;
            <button
              onClick={clearSearch}
              className="hover:text-white transition ml-0.5"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
          <span className="text-xs theme-text-secondary">
            ({events.length} result{events.length !== 1 ? 's' : ''})
          </span>
        </div>
      )}

      {/* Category Filter Bar */}
      <div className="theme-bg-card theme-border border p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 lg:pb-0">
          <button
            onClick={() => handleCategorySelect('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              typeFilter === '' ? 'theme-btn-primary' : 'theme-btn-secondary'
            }`}
          >
            All Events
          </button>

          <button
            onClick={() => handleCategorySelect('MOVIE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'MOVIE' ? 'theme-btn-primary' : 'theme-btn-secondary'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Movies
          </button>

          <button
            onClick={() => handleCategorySelect('CONCERT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'CONCERT' ? 'theme-btn-primary' : 'theme-btn-secondary'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Concerts
          </button>

          <button
            onClick={() => handleCategorySelect('THEATRE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'THEATRE' ? 'theme-btn-primary' : 'theme-btn-secondary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Plays
          </button>

          <button
            onClick={() => handleCategorySelect('SPORTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'SPORTS' ? 'theme-btn-primary' : 'theme-btn-secondary'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Sports
          </button>

          <button
            onClick={() => handleCategorySelect('COMEDY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'COMEDY' ? 'theme-btn-primary' : 'theme-btn-secondary'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Comedy
          </button>

          <button
            onClick={() => handleCategorySelect('WORKSHOP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'WORKSHOP' ? 'theme-btn-primary' : 'theme-btn-secondary'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Workshops
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="text-center py-16 theme-text-secondary text-xs">Loading catalog...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 theme-text-secondary theme-bg-card theme-border border rounded-2xl text-xs space-y-3 p-8">
          <p>
            {searchQuery
              ? `No events found matching "${searchQuery}".`
              : 'No events currently listed under this category.'}
          </p>
          <button
            onClick={clearSearch}
            className="theme-btn-primary px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            {searchQuery ? 'Clear Search' : 'Show All Events'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="theme-bg-card theme-border border rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={
                      evt.imageUrl ||
                      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={evt.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-pink-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-pink-500/30">
                    {evt.eventType}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm theme-text-main line-clamp-1 group-hover:theme-text-accent transition">
                    {evt.title}
                  </h3>
                  <p className="text-xs theme-text-secondary line-clamp-2">{evt.description}</p>

                  <div className="pt-2 space-y-1 text-xs theme-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 theme-text-accent" />
                      <span>
                        {new Date(evt.eventDate).toLocaleDateString()} at {evt.startTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 theme-text-accent" />
                      <span>{evt.venue?.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t theme-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] theme-text-secondary uppercase block font-bold">Starting at</span>
                  <span className="text-sm font-extrabold theme-text-main">
                    ₹{evt.startingPrice ?? evt.eventSeats?.[0]?.price ?? 15}
                  </span>
                </div>

                <Link
                  href={`/events/${evt.id}`}
                  className="theme-btn-primary font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1"
                >
                  <span>Select Seats</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 theme-text-secondary text-xs">Loading page...</div>}>
      <EventsContent />
    </Suspense>
  );
}
