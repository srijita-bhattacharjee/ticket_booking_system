'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { eventService, venueService } from '../../../../services/api';
import { Film, Music, DollarSign, Calendar, Clock, MapPin, ArrowLeft } from 'lucide-react';

export default function CreateEventPage() {
  const router = useRouter();

  const [venues, setVenues] = useState<any[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    venueId: '',
    title: '',
    description: '',
    eventType: 'MOVIE',
    eventDate: '',
    startTime: '19:00',
    premiumPrice: 45,
    standardPrice: 25,
  });

  useEffect(() => {
    venueService
      .getAll()
      .then((res) => {
        setVenues(res.data);
        if (res.data.length > 0) {
          setForm((prev) => ({ ...prev, venueId: res.data[0].id }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingVenues(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await eventService.create(form);
      router.push('/organiser/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <button
        onClick={() => router.back()}
        className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div>
        <h1 className="text-3xl font-extrabold text-white">Create New Event Listing</h1>
        <p className="text-xs text-slate-400">Configure showtimes, venue seat layout, and tiered pricing</p>
      </div>

      {error && <div className="bg-rose-950/80 border border-rose-600/60 p-4 rounded-xl text-rose-300 text-xs font-semibold">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Event Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, eventType: 'MOVIE' })}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  form.eventType === 'MOVIE'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Film className="w-4 h-4" /> Movie Screening
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, eventType: 'CONCERT' })}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  form.eventType === 'CONCERT'
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Music className="w-4 h-4" /> Live Concert
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Select Venue</label>
            {loadingVenues ? (
              <p className="text-xs text-slate-500">Loading venues...</p>
            ) : (
              <select
                value={form.venueId}
                onChange={(e) => setForm({ ...form, venueId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.location}) — {v._count?.seats || 0} Total Seats
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Show Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Interstellar 4K IMAX Experience"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              required
              placeholder="Describe event highlights, cast, or artists..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Event Date</label>
              <input
                type="date"
                required
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Start Time</label>
              <input
                type="text"
                required
                placeholder="e.g. 19:30"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Tiered Pricing Section */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category Tiered Pricing</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">Premium Seat Price ($)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.premiumPrice}
                  onChange={(e) => setForm({ ...form, premiumPrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">Standard Seat Price ($)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.standardPrice}
                  onChange={(e) => setForm({ ...form, standardPrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-purple-600/20"
        >
          {submitting ? 'Creating Event & Initializing Seat Map...' : 'Publish Event Listing'}
        </button>
      </form>
    </div>
  );
}
