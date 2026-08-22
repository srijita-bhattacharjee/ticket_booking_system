'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { foodService, venueService } from '../../../services/api';
import { Utensils, Plus, Trash2, CheckCircle2, XCircle, FileText, Image as ImageIcon, Upload, ShieldCheck, Tag } from 'lucide-react';

export default function AdminFoodPage() {
  const [stalls, setStalls] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingStall, setCreatingStall] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);
  const [error, setError] = useState('');

  // Stall Form
  const [stallForm, setStallForm] = useState({
    name: '',
    description: '',
    location: '',
    venueId: '',
    imageUrl: '',
  });

  // Menu Item Form
  const [itemForm, setItemForm] = useState({
    stallId: '',
    name: '',
    description: '',
    category: 'Combo',
    price: 12.99,
    imageUrl: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      foodService.getStalls(),
      foodService.getAllPartnerships(),
      venueService.getAll(),
    ])
      .then(([stallsRes, partRes, venuesRes]) => {
        setStalls(stallsRes.data);
        setPartnerships(partRes.data);
        setVenues(venuesRes.data);
        if (stallsRes.data.length > 0) {
          setItemForm((prev) => ({ ...prev, stallId: stallsRes.data[0].id }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStallFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStallForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStall = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingStall(true);
    setError('');
    try {
      await foodService.createStall(stallForm);
      setStallForm({ name: '', description: '', location: '', venueId: '', imageUrl: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create food stall');
    } finally {
      setCreatingStall(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingItem(true);
    setError('');
    try {
      await foodService.addMenuItem(itemForm);
      setItemForm({ stallId: stalls[0]?.id || '', name: '', description: '', category: 'Combo', price: 12.99, imageUrl: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add menu item');
    } finally {
      setCreatingItem(false);
    }
  };

  const handleDeleteStall = async (id: string) => {
    if (!confirm('Delete this food stall and all its menu items?')) return;
    try {
      await foodService.deleteStall(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete stall');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await foodService.deleteMenuItem(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const handlePartnershipAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await foodService.updatePartnershipStatus(id, status);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update partnership status');
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-4">
      <div>
        <h1 className="text-3xl font-extrabold theme-text-main flex items-center gap-2">
          <Utensils className="w-8 h-8 theme-text-accent" />
          Admin Food Stalls, Combos & Partnership Review
        </h1>
        <p className="text-xs theme-text-secondary">List venue food counters, add menu combos, and review Organiser Partnership Proof submissions</p>
      </div>

      {error && <div className="theme-bg-elevated theme-border border p-4 rounded-xl theme-text-accent text-xs font-semibold">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Food Stall */}
        <div className="theme-bg-card theme-border border rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold theme-text-main border-b theme-border pb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 theme-text-accent" />
            Create Food Stall / Counter
          </h3>

          <form onSubmit={handleCreateStall} className="space-y-4">
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Stall Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Cinema Gourmet Snacks & Soda Hub"
                value={stallForm.name}
                onChange={(e) => setStallForm({ ...stallForm, name: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Warm butter popcorn, nachos, and fountain sodas"
                value={stallForm.description}
                onChange={(e) => setStallForm({ ...stallForm, description: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Location Counter</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Lobby Counter 2"
                  value={stallForm.location}
                  onChange={(e) => setStallForm({ ...stallForm, location: e.target.value })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Associate Venue (Optional)</label>
                <select
                  value={stallForm.venueId}
                  onChange={(e) => setStallForm({ ...stallForm, venueId: e.target.value })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                >
                  <option value="">General / All Venues</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold theme-text-secondary flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 theme-text-accent" /> Stall Photo
              </label>
              <input
                type="url"
                placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                value={stallForm.imageUrl}
                onChange={(e) => setStallForm({ ...stallForm, imageUrl: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] theme-text-secondary uppercase font-bold">OR File:</span>
                <label className="cursor-pointer theme-btn-secondary px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <Upload className="w-3 h-3 theme-text-accent" /> Browse File
                  <input type="file" accept="image/*" onChange={handleStallFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingStall}
              className="w-full theme-btn-primary font-bold py-3 rounded-xl transition text-xs shadow-md"
            >
              {creatingStall ? 'Creating Food Stall...' : 'Create Food Stall'}
            </button>
          </form>
        </div>

        {/* Add Menu Item / Combo */}
        <div className="theme-bg-card theme-border border rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold theme-text-main border-b theme-border pb-3 flex items-center gap-2">
            <Tag className="w-5 h-5 theme-text-accent" />
            Add Menu Item / Combo
          </h3>

          <form onSubmit={handleCreateItem} className="space-y-4">
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Select Stall</label>
              <select
                value={itemForm.stallId}
                onChange={(e) => setItemForm({ ...itemForm, stallId: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              >
                {stalls.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Item / Combo Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jumbo Popcorn + Drink"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Category</label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                >
                  <option value="Combo">Combo Meal</option>
                  <option value="Popcorn">Popcorn</option>
                  <option value="Beverage">Beverage</option>
                  <option value="Snack">Gourmet Snack</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Warm butter popcorn with 32oz drink"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold theme-text-success mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min={1}
                  required
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold theme-text-secondary">Photo URL</label>
                <input
                  type="url"
                  placeholder="Image URL"
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-2.5 text-xs theme-text-main focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingItem || stalls.length === 0}
              className="w-full theme-btn-primary font-bold py-3 rounded-xl transition text-xs shadow-md"
            >
              {creatingItem ? 'Adding Menu Item...' : 'Add Item to Menu'}
            </button>
          </form>
        </div>
      </div>

      {/* Review Organisers' Partnership Proof Submissions */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold theme-text-main flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 theme-text-accent" />
          Submitted Organiser Partnership Proofs ({partnerships.length})
        </h3>

        {partnerships.length === 0 ? (
          <div className="theme-bg-card theme-border border rounded-2xl p-8 text-center theme-text-secondary text-xs">
            No organiser partnership proof documents submitted yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partnerships.map((p) => (
              <div key={p.id} className="theme-bg-card theme-border border rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      p.status === 'APPROVED'
                        ? 'theme-badge-success'
                        : 'theme-badge-accent'
                    }`}
                  >
                    {p.status}
                  </span>
                  <span className="text-xs theme-text-secondary font-mono">Ref: {p.agreementRef}</span>
                </div>

                <div>
                  <h4 className="text-base font-bold theme-text-main">{p.partnerName}</h4>
                  <p className="text-xs theme-text-secondary">Organiser: {p.organiser?.name} ({p.organiser?.email})</p>
                  <p className="text-xs theme-text-secondary">Target Stall: {p.foodStall?.name}</p>
                </div>

                {p.documentUrl && (
                  <a
                    href={p.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs theme-text-accent font-bold hover:underline"
                  >
                    <FileText className="w-4 h-4" /> View Submitted Contract / Document
                  </a>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 border-t theme-border">
                  {p.status !== 'APPROVED' && (
                    <button
                      onClick={() => handlePartnershipAction(p.id, 'APPROVED')}
                      className="theme-btn-primary font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {p.status !== 'REJECTED' && (
                    <button
                      onClick={() => handlePartnershipAction(p.id, 'REJECTED')}
                      className="theme-btn-secondary font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5 theme-text-accent" /> Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing Food Stalls & Menus Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold theme-text-main">Active Food Stalls & Menu Catalogs ({stalls.length})</h3>

        {loading ? (
          <div className="text-center py-12 theme-text-secondary text-xs">Loading food stalls...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stalls.map((s) => (
              <div key={s.id} className="theme-bg-card theme-border border rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
                <div className="h-40 w-full relative theme-bg-main overflow-hidden">
                  <img
                    src={s.imageUrl || 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=800&q=80'}
                    alt={s.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <button
                    onClick={() => handleDeleteStall(s.id)}
                    className="absolute top-3 right-3 p-2 rounded-lg theme-btn-secondary transition"
                    title="Delete Stall"
                  >
                    <Trash2 className="w-4 h-4 theme-text-accent" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-lg font-bold theme-text-main">{s.name}</h4>
                    <p className="text-xs theme-text-secondary">{s.description}</p>
                    <p className="text-[11px] theme-text-secondary mt-1">📍 {s.location}</p>
                  </div>

                  <div className="space-y-2 border-t theme-border pt-3">
                    <span className="text-xs font-bold theme-text-main">Menu Items & Combos ({s.items?.length || 0}):</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {s.items?.map((item: any) => (
                        <div key={item.id} className="theme-bg-elevated p-2 rounded-lg theme-border border flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold theme-text-main">{item.name}</p>
                            <span className="text-[10px] theme-text-secondary uppercase font-semibold">{item.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold theme-text-success">${item.price}</span>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="theme-text-secondary hover:theme-text-accent"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
