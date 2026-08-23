'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { venueService } from '../../../services/api';
import { Shield, Plus, Trash2, MapPin, Grid, Image as ImageIcon, Upload, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import {
  ActivityType,
  BookingModel,
  ACTIVITY_DEFINITIONS,
  ResourceConfigData,
} from '../../../types/activity';
import ResourceLayoutEditor from '../../../components/admin/ResourceLayoutEditor';

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Activity & Booking Model Selection State
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('CINEMA');
  const [selectedBookingModel, setSelectedBookingModel] = useState<BookingModel>('SEAT');

  // Step 2: Venue & Hall Basics
  const [form, setForm] = useState({
    name: '',
    location: '',
    imageUrl: '',
    hallName: 'Screen 1 / Main Hall',
    rows: 6,
    seatsPerRow: 8,
    premiumRowsCount: 2,
  });

  // Step 3: Activity-Specific Resource Configuration
  const [resourceConfig, setResourceConfig] = useState<ResourceConfigData>({});

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

  // Update booking model defaults when activity type changes
  const handleActivityChange = (type: ActivityType) => {
    setSelectedActivity(type);
    const def = ACTIVITY_DEFINITIONS[type];
    setSelectedBookingModel(def.defaultModel);
  };

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
    setSuccessMessage('');

    try {
      const payload = {
        name: form.name,
        location: form.location,
        imageUrl: form.imageUrl,
        activityType: selectedActivity,
        bookingModel: selectedBookingModel,
        hallName: form.hallName,
        rows: form.rows,
        seatsPerRow: form.seatsPerRow,
        premiumRowsCount: form.premiumRowsCount,
        resourceConfig: JSON.stringify(resourceConfig),
      };

      await venueService.create(payload);
      setSuccessMessage(`Successfully created ${ACTIVITY_DEFINITIONS[selectedActivity].label} venue configuration!`);
      setForm({ name: '', location: '', imageUrl: '', hallName: 'Screen 1 / Main Hall', rows: 6, seatsPerRow: 8, premiumRowsCount: 2 });
      fetchVenues();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save venue resource configuration');
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

  // Dynamic Header Subtitle generator based on selected mode
  const getHeaderSubtitle = () => {
    switch (selectedBookingModel) {
      case 'SEAT':
        return 'Seat Layout: Configure sections, rows, seats, row labels, and pricing categories';
      case 'GENERAL_ADMISSION':
      case 'CAPACITY':
        return 'Zone Capacity: Configure standing zones, total capacity allocation, entry gates, and pricing';
      case 'SLOT':
        return 'Timed Slots: Configure rooms, session duration, max players per slot, and slot prices';
      case 'TEAM':
        return 'Team Registration: Configure maximum team limits, team size boundaries, and registration fees';
      default:
        return 'Configure venues, halls, spaces, layout resources, and booking models';
    }
  };

  const currentDef = ACTIVITY_DEFINITIONS[selectedActivity];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Dynamic Admin Header */}
      <div className="theme-bg-elevated theme-border border p-6 rounded-2xl shadow-sm space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold theme-text-main flex items-center gap-2.5">
          <Shield className="w-7 h-7 theme-text-accent" />
          Admin Activity & Venue Configuration
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-purple-400">
          {getHeaderSubtitle()}
        </p>
      </div>

      {/* Progressive Multi-Step Admin Creation Form */}
      <div className="theme-bg-card theme-border border rounded-2xl p-6 sm:p-8 space-y-8">
        <h3 className="text-lg font-bold theme-text-main border-b theme-border pb-3 flex items-center gap-2">
          <Plus className="w-5 h-5 theme-text-accent" />
          Configure New Activity Resource & Venue Space
        </h3>

        {error && <div className="theme-bg-elevated theme-border border p-3.5 rounded-xl text-red-400 text-xs font-semibold">{error}</div>}
        {successMessage && <div className="theme-bg-elevated theme-border border p-3.5 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {successMessage}</div>}

        <form onSubmit={handleCreateVenue} className="space-y-8">
          
          {/* STEP 1: Select Activity Type */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider theme-text-accent">
              Step 1: Select Activity Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {Object.values(ACTIVITY_DEFINITIONS).map((def) => {
                const isSelected = selectedActivity === def.type;
                return (
                  <button
                    key={def.type}
                    type="button"
                    onClick={() => handleActivityChange(def.type)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'theme-bg-elevated border-purple-500 ring-2 ring-purple-500/40 shadow-md'
                        : 'theme-bg-input theme-border hover:theme-bg-elevated'
                    }`}
                  >
                    <div className="text-xl mb-1">{def.icon}</div>
                    <p className="text-xs font-bold theme-text-main leading-tight">{def.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Select Booking Model */}
          <div className="space-y-3 border-t theme-border pt-6">
            <label className="block text-xs font-extrabold uppercase tracking-wider theme-text-accent">
              Step 2: Select Booking Model for {currentDef.label}
            </label>
            <div className="flex flex-wrap gap-2">
              {currentDef.supportedModels.map((model) => {
                const isSelected = selectedBookingModel === model;
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setSelectedBookingModel(model)}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                      isSelected
                        ? 'theme-bg-elevated border-purple-500 text-purple-400 ring-2 ring-purple-500/30'
                        : 'theme-bg-input theme-border theme-text-secondary hover:theme-text-main'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                    {model} {model === currentDef.defaultModel ? '(Recommended)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Venue & Space Details */}
          <div className="space-y-4 border-t theme-border pt-6">
            <label className="block text-xs font-extrabold uppercase tracking-wider theme-text-accent">
              Step 3: Venue & Space Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Venue Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Apex Multiplex / IG Arena"
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
                  placeholder="e.g. Downtown Sector 17, Gate 2"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Hall / Space Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Screen 1 / Concert Arena / Room A"
                  value={form.hallName}
                  onChange={(e) => setForm({ ...form, hallName: e.target.value })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>
            </div>

            {/* Cover Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold theme-text-secondary flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 theme-text-accent" /> Venue Cover Photo
                </label>
                <input
                  type="url"
                  placeholder="Paste direct Image URL (e.g. https://images.unsplash.com/...)"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] theme-text-secondary uppercase font-bold">OR Upload File:</span>
                  <label className="cursor-pointer theme-btn-secondary px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5 theme-text-accent" />
                    Browse Photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="w-full h-24 theme-bg-main rounded-xl theme-border border overflow-hidden flex items-center justify-center">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Venue Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center theme-text-secondary text-[11px] space-y-0.5">
                    <ImageIcon className="w-5 h-5 mx-auto opacity-50" />
                    <span>No Photo Uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 4: Activity-Specific Resource Configuration Editor */}
          <div className="space-y-3 border-t theme-border pt-6">
            <label className="block text-xs font-extrabold uppercase tracking-wider theme-text-accent">
              Step 4: Configure Activity Resources & Layout
            </label>
            <ResourceLayoutEditor
              activityType={selectedActivity}
              bookingModel={selectedBookingModel}
              config={resourceConfig}
              onChange={setResourceConfig}
              seatRows={form.rows}
              setSeatRows={(r) => setForm({ ...form, rows: r })}
              seatsPerRow={form.seatsPerRow}
              setSeatsPerRow={(s) => setForm({ ...form, seatsPerRow: s })}
              premiumRowsCount={form.premiumRowsCount}
              setPremiumRowsCount={(p) => setForm({ ...form, premiumRowsCount: p })}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={creating}
            className="w-full theme-btn-primary font-extrabold py-3.5 rounded-xl transition text-sm shadow-lg flex items-center justify-center gap-2"
          >
            {creating ? (
              'Saving Activity Resource Layout...'
            ) : (
              <>
                Save & Publish {currentDef.label} Configuration <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Existing Configured Venues & Spaces Listing */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold theme-text-main flex items-center gap-2">
          <Layers className="w-5 h-5 theme-text-accent" /> Configured Activity Venues & Spaces ({venues.length})
        </h3>
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
                      <Trash2 className="w-4 h-4 text-red-400" />
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
                        <Grid className="w-4 h-4 theme-text-accent" /> Capacity / Layout
                      </span>
                      <span className="font-extrabold theme-text-main">{v._count?.seats || v.seats?.length || 0} Resource Units</span>
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
