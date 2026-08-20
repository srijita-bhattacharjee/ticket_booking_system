'use client';

import { useState, useEffect } from 'react';
import { venueService } from '../../../services/api';
import { Shield, Plus, Trash2, MapPin, Grid } from 'lucide-react';

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    location: '',
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

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await venueService.create(form);
      setForm({ name: '', location: '', rows: 6, seatsPerRow: 8, premiumRowsCount: 2 });
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Shield className="w-7 h-7 text-amber-400" />
          Admin Venue & Seat Grid Layout Builder
        </h1>
        <p className="text-xs text-slate-400">Manage venue capacity, seat row counts, and seat category tiers</p>
      </div>

      {/* Create Venue Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-400" />
          Create New Venue Layout
        </h3>

        {error && <div className="bg-rose-950/80 border border-rose-600/60 p-3.5 rounded-xl text-rose-300 text-xs font-semibold">{error}</div>}

        <form onSubmit={handleCreateVenue} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Venue Name</label>
              <input
                type="text"
                required
                placeholder="e.g. IMAX Theater Hall 3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Downtown Cineplex, Floor 2"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Total Rows (A, B, C...)</label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={form.rows}
                onChange={(e) => setForm({ ...form, rows: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Seats Per Row</label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={form.seatsPerRow}
                onChange={(e) => setForm({ ...form, seatsPerRow: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">Premium Front Rows Count</label>
              <input
                type="number"
                min={0}
                max={form.rows}
                required
                value={form.premiumRowsCount}
                onChange={(e) => setForm({ ...form, premiumRowsCount: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition text-sm shadow-lg shadow-amber-500/20"
          >
            {creating ? 'Generating Venue Seats Grid...' : 'Generate Venue & Seat Layout'}
          </button>
        </form>
      </div>

      {/* Venues Listing */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Existing Venue Layouts ({venues.length})</h3>
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading venues...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {venues.map((v) => (
              <div key={v.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white">{v.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {v.location}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteVenue(v.id)}
                    className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 transition"
                    title="Delete Venue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Grid className="w-4 h-4 text-sky-400" /> Total Capacity
                  </span>
                  <span className="font-extrabold text-white">{v._count?.seats || 0} Seats</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
