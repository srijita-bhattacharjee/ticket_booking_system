'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { venueService } from '../../../services/api';
import { Shield, Plus, Trash2, MapPin, Grid, Image as ImageIcon, Upload } from 'lucide-react';

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    location: '',
    imageUrl: '',
    rows: 6,
    seatsPerRow: 8,
    premiumRowsCount: 2,
  });

  const fetchVenues = () => {
    setLoading(true);
    venueService
      .getAll()
      .then((res) => setVenues(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVenues();
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

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await venueService.create(form);
      setForm({ name: '', location: '', imageUrl: '', rows: 6, seatsPerRow: 8, premiumRowsCount: 2 });
      fetchVenues();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create venue layout');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteVenue = async (id: string) => {
    if (!confirm('Are you sure you want to delete this venue layout?')) return;
    try {
      await venueService.delete(id);
      fetchVenues();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete venue');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      <div>
        <h1 className="text-3xl font-extrabold theme-text-main flex items-center gap-2">
          <Shield className="w-7 h-7 theme-text-accent" />
          Admin Venue & Seat Grid Layout Builder
        </h1>
        <p className="text-xs theme-text-secondary">Manage venue capacity, seat row counts, seat category tiers, and venue cover photos</p>
      </div>

      {/* Create Venue Form */}
      <div className="theme-bg-card theme-border border rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold theme-text-main border-b theme-border pb-3 flex items-center gap-2">
          <Plus className="w-5 h-5 theme-text-accent" />
          Create New Venue Layout
        </h3>

        {error && <div className="theme-bg-elevated theme-border border p-3.5 rounded-xl theme-text-accent text-xs font-semibold">{error}</div>}

        <form onSubmit={handleCreateVenue} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Venue Name</label>
              <input
                type="text"
                required
                placeholder="e.g. IMAX Theater Hall 3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Downtown Cineplex, Floor 2"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>
          </div>

          {/* Venue Cover Image Upload / URL Input */}
          <div className="space-y-2 border-t theme-border pt-4">
            <label className="block text-xs font-bold theme-text-secondary flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 theme-text-accent" /> Venue Cover Photo
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
                  <label className="cursor-pointer theme-btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5 theme-text-accent" />
                    Browse Photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              <div className="w-full h-24 theme-bg-main rounded-xl theme-border border overflow-hidden flex items-center justify-center relative">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Venue Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center theme-text-secondary text-[11px] space-y-0.5">
                    <ImageIcon className="w-5 h-5 mx-auto opacity-50" />
                    <span>No Image Preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t theme-border pt-4">
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Total Rows (A, B, C...)</label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={form.rows}
                onChange={(e) => setForm({ ...form, rows: Number(e.target.value) })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Seats Per Row</label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={form.seatsPerRow}
                onChange={(e) => setForm({ ...form, seatsPerRow: Number(e.target.value) })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-500 mb-1">Premium Front Rows Count</label>
              <input
                type="number"
                min={0}
                max={form.rows}
                required
                value={form.premiumRowsCount}
                onChange={(e) => setForm({ ...form, premiumRowsCount: Number(e.target.value) })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full theme-btn-primary font-bold py-3 rounded-xl transition text-sm shadow-md"
          >
            {creating ? 'Generating Venue Seats Grid...' : 'Generate Venue & Seat Layout'}
          </button>
        </form>
      </div>

      {/* Venues Listing */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold theme-text-main">Existing Venue Layouts ({venues.length})</h3>
        {loading ? (
          <div className="text-center py-12 theme-text-secondary text-xs">Loading venues...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {venues.map((v) => {
              const displayImage = v.imageUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80';
              return (
                <div key={v.id} className="theme-bg-card theme-border border rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
                  <div className="h-40 w-full relative theme-bg-main overflow-hidden">
                    <img src={displayImage} alt={v.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <button
                      onClick={() => handleDeleteVenue(v.id)}
                      className="absolute top-3 right-3 p-2 rounded-lg theme-btn-secondary transition"
                      title="Delete Venue"
                    >
                      <Trash2 className="w-4 h-4 theme-text-accent" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="text-lg font-bold theme-text-main">{v.name}</h4>
                      <p className="text-xs theme-text-secondary flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 theme-text-accent" /> {v.location}
                      </p>
                    </div>

                    <div className="theme-bg-elevated p-3 rounded-xl theme-border border flex items-center justify-between text-xs theme-text-main">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Grid className="w-4 h-4 theme-text-accent" /> Total Capacity
                      </span>
                      <span className="font-extrabold theme-text-main">{v._count?.seats || v.seats?.length || 0} Seats</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
