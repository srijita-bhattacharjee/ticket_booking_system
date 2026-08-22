'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { eventService, venueService } from '../../../../services/api';
import { Film, Music, ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react';

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
    imageUrl: '',
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

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <button
        onClick={() => router.back()}
        className="text-xs font-semibold theme-text-secondary hover:theme-text-main flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div>
        <h1 className="text-3xl font-extrabold theme-text-main">Create New Event Listing</h1>
        <p className="text-xs theme-text-secondary">Configure showtimes, venue seat layout, event cover photo, and tiered pricing</p>
      </div>

      {error && <div className="theme-bg-elevated theme-border border p-4 rounded-xl theme-text-accent text-xs font-semibold">{error}</div>}

      <form onSubmit={handleSubmit} className="theme-bg-card theme-border border rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold theme-text-secondary mb-1">Event Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, eventType: 'MOVIE' })}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  form.eventType === 'MOVIE'
                    ? 'theme-btn-primary'
                    : 'theme-btn-secondary'
                }`}
              >
                <Film className="w-4 h-4" /> Movie Screening
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, eventType: 'CONCERT' })}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  form.eventType === 'CONCERT'
                    ? 'theme-btn-primary'
                    : 'theme-btn-secondary'
                }`}
              >
                <Music className="w-4 h-4" /> Live Concert
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold theme-text-secondary mb-1">Select Venue</label>
            {loadingVenues ? (
              <p className="text-xs theme-text-secondary">Loading venues...</p>
            ) : (
              <select
                value={form.venueId}
                onChange={(e) => setForm({ ...form, venueId: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
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
            <label className="block text-xs font-bold theme-text-secondary mb-1">Show Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Interstellar 4K IMAX Experience"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold theme-text-secondary mb-1">Description</label>
            <textarea
              rows={3}
              required
              placeholder="Describe event highlights, cast, or artists..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
            />
          </div>

          {/* Event Poster / Cover Image Upload & URL */}
          <div className="space-y-2 border-t theme-border pt-4">
            <label className="block text-xs font-bold theme-text-secondary flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 theme-text-accent" /> Event Cover Photo / Poster
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 space-y-2">
                <input
                  type="url"
                  placeholder="Paste direct Image URL (e.g. https://images.unsplash.com/...)"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[11px] theme-text-secondary uppercase font-bold">OR Upload File:</span>
                  <label className="cursor-pointer theme-btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border">
                    <Upload className="w-3.5 h-3.5 theme-text-accent" />
                    Browse Photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              <div className="w-full h-24 theme-bg-main rounded-xl theme-border border overflow-hidden flex items-center justify-center relative">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Event Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center theme-text-secondary text-[11px] space-y-0.5">
                    <ImageIcon className="w-5 h-5 mx-auto opacity-50" />
                    <span>No Image Preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Event Date</label>
              <input
                type="date"
                required
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Start Time</label>
              <input
                type="text"
                required
                placeholder="e.g. 19:30"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>
          </div>

          {/* Tiered Pricing Section */}
          <div className="border-t theme-border pt-4 space-y-3">
            <h4 className="text-xs font-bold theme-text-secondary uppercase tracking-wider">Category Tiered Pricing</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-500 mb-1">Premium Seat Price ($)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.premiumPrice}
                  onChange={(e) => setForm({ ...form, premiumPrice: Number(e.target.value) })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold theme-text-success mb-1">Standard Seat Price ($)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.standardPrice}
                  onChange={(e) => setForm({ ...form, standardPrice: Number(e.target.value) })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full theme-btn-primary font-bold py-3.5 rounded-xl transition text-sm shadow-md"
        >
          {submitting ? 'Creating Event & Initializing Seat Map...' : 'Publish Event Listing'}
        </button>
      </form>
    </div>
  );
}
