'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, CalendarDays, MapPin, ChevronRight, Loader2, Inbox } from 'lucide-react';
import { wishlistService } from '../../services/api';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await wishlistService.getWishlist();
      setWishlist(res.data || []);
    } catch (err: any) {
      if (err?.response?.status === 401) window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (eventId: string) => {
    if (removing.has(eventId)) return;
    setRemoving((p) => new Set(p).add(eventId));
    try {
      await wishlistService.toggle(eventId);
      setWishlist((prev) => prev.filter((w) => w.eventId !== eventId));
    } finally {
      setRemoving((p) => { const n = new Set(p); n.delete(eventId); return n; });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin theme-text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <Heart className="w-7 h-7 text-pink-500 fill-pink-500" />
        <h1 className="text-2xl font-extrabold theme-text-main">My Wishlist</h1>
        <span className="ml-auto text-sm theme-text-secondary">{wishlist.length} saved</span>
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 theme-bg-card rounded-2xl border theme-border">
          <Inbox className="w-14 h-14 theme-text-secondary opacity-40" />
          <p className="theme-text-secondary text-sm font-medium">Your wishlist is empty.</p>
          <Link href="/" className="theme-btn-primary px-5 py-2 rounded-xl text-sm font-bold">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {wishlist.map((w) => {
            const evt = w.event;
            const minPrice = evt?.seats?.[0]?.price ?? evt?.startingPrice ?? 0;
            return (
              <div
                key={w.id}
                className="theme-bg-card theme-border border rounded-2xl overflow-hidden shadow-lg flex flex-col group"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={evt?.imageUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80'}
                    alt={evt?.title || 'Event'}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-70" />
                  <button
                    onClick={() => handleRemove(w.eventId)}
                    disabled={removing.has(w.eventId)}
                    title="Remove from wishlist"
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md transition disabled:opacity-50"
                  >
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h2 className="font-extrabold text-sm theme-text-main line-clamp-2">{evt?.title}</h2>
                  <div className="flex items-center gap-1.5 text-xs theme-text-secondary">
                    <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                    {evt?.eventDate
                      ? new Date(evt.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                    {evt?.startTime && <span>• {evt.startTime}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs theme-text-secondary">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {evt?.venue?.location || evt?.venue?.name || '—'}
                  </div>

                  <div className="mt-auto pt-3 flex items-center justify-between border-t theme-border">
                    <span className="text-sm font-black theme-text-main">
                      ₹{minPrice.toLocaleString('en-IN')}
                    </span>
                    <Link
                      href={"/events/" + w.eventId}
                      className="theme-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      Book <ChevronRight className="w-3.5 h-3.5" />
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
