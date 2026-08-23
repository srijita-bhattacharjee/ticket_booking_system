'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { eventService, venueService } from '../../../../services/api';
import {
  Film,
  Music,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Trophy,
  Mic,
  Palette,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  Building,
  Shield,
  Layers,
  HelpCircle,
  Eye,
  Send,
} from 'lucide-react';
import {
  ActivityType,
  BookingModel,
  ACTIVITY_DEFINITIONS,
  ResourceConfigData,
} from '../../../../types/activity';
import ResourceLayoutEditor from '../../../../components/admin/ResourceLayoutEditor';

const WIZARD_STEPS = [
  { id: 1, label: 'Create Activity', desc: 'Title & Highlights' },
  { id: 2, label: 'Activity Type', desc: 'Category Classification' },
  { id: 3, label: 'Booking Model', desc: 'Seating / Slot / Capacity' },
  { id: 4, label: 'Select Venue', desc: 'Physical Location' },
  { id: 5, label: 'Select Hall / Space', desc: 'Specific Auditorium' },
  { id: 6, label: 'Configure Resources', desc: 'Layout & Capacity' },
  { id: 7, label: 'Schedule', desc: 'Date & Showtime' },
  { id: 8, label: 'Pricing Tiers', desc: 'Category Tiered Pricing' },
  { id: 9, label: 'Booking Rules', desc: 'Hold TTL & Max Limits' },
  { id: 10, label: 'Preview', desc: 'Verify Configuration' },
  { id: 11, label: 'Publish', desc: 'Deploy to Live Catalog' },
];

export default function CreateEventPage() {
  const router = useRouter();

  // Wizard Navigation State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [venues, setVenues] = useState<any[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Minimum allowed event date is 3 days from today
  const minDateString = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Activity & Model selection
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('CINEMA');
  const [selectedBookingModel, setSelectedBookingModel] = useState<BookingModel>('SEAT');

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    venueId: '',
    hallName: 'Main Screen / Hall 1',
    eventDate: minDateString,
    startTime: '19:00',
    durationMinutes: 120,
    imageUrl: '',
    trailerUrl: '',
    vipPrice: 85,
    premiumPrice: 45,
    standardPrice: 25,
    maxTicketsPerOrder: 6,
    holdDurationMinutes: 10,
    cancellationWindowHours: 24,
  });

  // Resource Config State
  const [resourceConfig, setResourceConfig] = useState<ResourceConfigData>({});
  const [seatRows, setSeatRows] = useState<number>(6);
  const [seatsPerRow, setSeatsPerRow] = useState<number>(8);
  const [premiumRowsCount, setPremiumRowsCount] = useState<number>(2);

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

  const handleActivitySelect = (type: ActivityType) => {
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

  const currentDef = ACTIVITY_DEFINITIONS[selectedActivity];
  const selectedVenueObj = venues.find((v) => v.id === form.venueId);

  const handleNext = () => {
    if (currentStep === 1 && (!form.title.trim() || !form.description.trim())) {
      setError('Please provide an activity title and description to proceed.');
      return;
    }
    setError('');
    if (currentStep < 11) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: form.title,
        description: form.description,
        eventType: selectedActivity === 'CINEMA' ? 'MOVIE' : selectedActivity === 'CONCERT' ? 'CONCERT' : selectedActivity === 'THEATRE' ? 'THEATRE' : selectedActivity === 'SPORTS' ? 'SPORTS' : selectedActivity === 'WORKSHOP' ? 'WORKSHOP' : 'COMEDY',
        activityType: selectedActivity,
        bookingModel: selectedBookingModel,
        venueId: form.venueId,
        hallName: form.hallName,
        eventDate: form.eventDate,
        startTime: form.startTime,
        imageUrl: form.imageUrl,
        trailerUrl: form.trailerUrl,
        vipPrice: form.vipPrice,
        premiumPrice: form.premiumPrice,
        standardPrice: form.standardPrice,
        resourceConfig: JSON.stringify(resourceConfig),
      };

      await eventService.create(payload);
      router.push('/organiser/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish activity listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Top Header Navigation */}
      <button
        onClick={() => router.back()}
        className="text-xs font-semibold theme-text-secondary hover:theme-text-main flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Stepper Header Title */}
      <div className="theme-bg-elevated theme-border border p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black theme-text-main flex items-center gap-2">
            <Sparkles className="w-6 h-6 theme-text-accent" /> Activity &amp; Event Creation Wizard
          </h1>
          <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full theme-bg-card theme-border border theme-text-accent">
            Step {currentStep} of 11
          </span>
        </div>
        <p className="text-xs theme-text-secondary">
          {WIZARD_STEPS[currentStep - 1].label}: {WIZARD_STEPS[currentStep - 1].desc}
        </p>
      </div>

      {/* 11-Step Interactive Stepper Progress Indicator */}
      <div className="theme-bg-card theme-border border p-4 rounded-2xl overflow-x-auto scrollbar-hide">
        <div className="flex items-center min-w-[700px] justify-between">
          {WIZARD_STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                onClick={() => {
                  if (step.id <= currentStep) setCurrentStep(step.id);
                }}
                className={`flex flex-col items-center gap-1.5 transition text-center flex-1 ${
                  isCurrent
                    ? 'theme-text-accent font-extrabold'
                    : isCompleted
                    ? 'text-emerald-400 font-bold'
                    : 'theme-text-secondary opacity-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition border ${
                    isCurrent
                      ? 'theme-bg-elevated border-purple-500 ring-2 ring-purple-500/40 shadow-md'
                      : isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'theme-bg-input theme-border'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : step.id}
                </div>
                <span className="text-[10px] leading-tight font-semibold hidden sm:block">
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="theme-bg-elevated theme-border border p-4 rounded-xl theme-text-accent text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Step Content Container */}
      <div className="theme-bg-card theme-border border rounded-2xl p-6 sm:p-8 space-y-6">

        {/* STEP 1: Create Activity Basics */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 theme-text-accent" /> Step 1: Create Activity &amp; Overview
            </h3>

            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Activity Show Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Interstellar 4K IMAX Experience / World Tour Live Concert"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Activity Description</label>
              <textarea
                rows={4}
                required
                placeholder="Describe key highlights, schedule lineup, age guidance, or artist details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>

            {/* Poster Upload */}
            <div className="space-y-2 border-t theme-border pt-4">
              <label className="block text-xs font-bold theme-text-secondary flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 theme-text-accent" /> Activity Cover Photo / Poster
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
                      <Upload className="w-3.5 h-3.5 theme-text-accent" /> Browse Photo
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="w-full h-24 theme-bg-main rounded-xl theme-border border overflow-hidden flex items-center justify-center">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center theme-text-secondary text-[11px] space-y-0.5">
                      <ImageIcon className="w-5 h-5 mx-auto opacity-50" />
                      <span>No Photo Uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Select Activity Type */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 theme-text-accent" /> Step 2: Select Activity Type
            </h3>
            <p className="text-xs theme-text-secondary">Select the primary activity classification to derive default booking models.</p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.values(ACTIVITY_DEFINITIONS).map((def) => {
                const isSelected = selectedActivity === def.type;
                return (
                  <button
                    key={def.type}
                    type="button"
                    onClick={() => handleActivitySelect(def.type)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'theme-bg-elevated border-purple-500 ring-2 ring-purple-500/40 shadow-md'
                        : 'theme-bg-input theme-border hover:theme-bg-elevated'
                    }`}
                  >
                    <div className="text-2xl mb-1">{def.icon}</div>
                    <p className="text-xs font-bold theme-text-main leading-tight">{def.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Select Booking Model */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 theme-text-accent" /> Step 3: Select Booking Model for {currentDef.label}
            </h3>
            <p className="text-xs theme-text-secondary">Supported resource model abstractions for this activity:</p>

            <div className="flex flex-wrap gap-3">
              {currentDef.supportedModels.map((model) => {
                const isSelected = selectedBookingModel === model;
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setSelectedBookingModel(model)}
                    className={`px-5 py-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                      isSelected
                        ? 'theme-bg-elevated border-purple-500 text-purple-300 ring-2 ring-purple-500/30'
                        : 'theme-bg-input theme-border theme-text-secondary hover:theme-text-main'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                    {model} {model === currentDef.defaultModel ? '(Recommended)' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Select Venue */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-2 flex items-center gap-2">
              <Building className="w-5 h-5 theme-text-accent" /> Step 4: Select Venue
            </h3>

            {loadingVenues ? (
              <p className="text-xs theme-text-secondary">Loading configured venues...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {venues.map((v) => {
                  const isSelected = form.venueId === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setForm({ ...form, venueId: v.id })}
                      className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                        isSelected
                          ? 'theme-bg-elevated border-purple-500 ring-2 ring-purple-500/40'
                          : 'theme-bg-input theme-border hover:theme-bg-elevated'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold theme-text-main">{v.name}</h4>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                      </div>
                      <p className="text-xs theme-text-secondary">{v.location}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Select Hall / Space */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-2 flex items-center gap-2">
              <Building className="w-5 h-5 theme-text-accent" /> Step 5: Select Hall / Space Name
            </h3>
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Hall / Auditorium / Screen Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Screen 1 IMAX / Main Concert Arena / Workshop Room B"
                value={form.hallName}
                onChange={(e) => setForm({ ...form, hallName: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 6: Configure Activity-Specific Resources */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 theme-text-accent" /> Step 6: Configure Activity-Specific Resources
            </h3>
            <p className="text-xs theme-text-secondary">Dynamically displaying controls strictly relevant to {selectedActivity} ({selectedBookingModel}):</p>
            <ResourceLayoutEditor
              activityType={selectedActivity}
              bookingModel={selectedBookingModel}
              config={resourceConfig}
              onChange={setResourceConfig}
              seatRows={seatRows}
              setSeatRows={setSeatRows}
              seatsPerRow={seatsPerRow}
              setSeatsPerRow={setSeatsPerRow}
              premiumRowsCount={premiumRowsCount}
              setPremiumRowsCount={setPremiumRowsCount}
            />
          </div>
        )}

        {/* STEP 7: Configure Schedule */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 theme-text-accent" /> Step 7: Configure Schedule &amp; Timing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Event Date (Min 3 days notice)</label>
                <input
                  type="date"
                  required
                  min={minDateString}
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
              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min={15}
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Configure Pricing */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 theme-text-accent" /> Step 8: Category Tiered Pricing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">VIP Tier Price (₹)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.vipPrice}
                  onChange={(e) => setForm({ ...form, vipPrice: Number(e.target.value) })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-purple-400 mb-1">Premium Tier Price (₹)</label>
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
                <label className="block text-xs font-bold theme-text-success mb-1">Standard Tier Price (₹)</label>
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
        )}

        {/* STEP 9: Configure Booking Rules */}
        {currentStep === 9 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 theme-text-accent" /> Step 9: Configure Booking Rules &amp; Guards
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Max Tickets / Order</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.maxTicketsPerOrder}
                  onChange={(e) => setForm({ ...form, maxTicketsPerOrder: Number(e.target.value) })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Hold Lock TTL (Minutes)</label>
                <input
                  type="number"
                  disabled
                  value={form.holdDurationMinutes}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-secondary cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Cancellation Cutoff (Hours)</label>
                <input
                  type="number"
                  value={form.cancellationWindowHours}
                  onChange={(e) => setForm({ ...form, cancellationWindowHours: Number(e.target.value) })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: Preview */}
        {currentStep === 10 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 theme-text-accent" /> Step 10: Activity Configuration Preview
            </h3>

            <div className="theme-bg-elevated theme-border border p-5 rounded-2xl space-y-3 text-xs">
              <p className="font-extrabold text-sm theme-text-main">{form.title}</p>
              <p className="theme-text-secondary">{form.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t theme-border font-bold">
                <div><span className="theme-text-secondary">Type:</span> {selectedActivity}</div>
                <div><span className="theme-text-secondary">Model:</span> {selectedBookingModel}</div>
                <div><span className="theme-text-secondary">Venue:</span> {selectedVenueObj?.name || 'Selected Venue'}</div>
                <div><span className="theme-text-secondary">Date:</span> {form.eventDate} ({form.startTime})</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 11: Publish */}
        {currentStep === 11 && (
          <div className="space-y-4 text-center py-6">
            <div className="w-12 h-12 rounded-full theme-bg-elevated border border-purple-500 text-purple-400 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold theme-text-main">Ready to Deploy Activity Listing</h3>
            <p className="text-xs theme-text-secondary max-w-md mx-auto">
              Clicking Publish will deploy this {selectedActivity} listing to the public catalog and generate seat/resource maps.
            </p>
          </div>
        )}

        {/* Bottom Wizard Navigation Controls */}
        <div className="flex items-center justify-between border-t theme-border pt-6">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="theme-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Step
          </button>

          {currentStep < 11 ? (
            <button
              type="button"
              onClick={handleNext}
              className="theme-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold transition shadow-md flex items-center gap-1.5"
            >
              Next Step ({currentStep + 1}/11) <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={submitting}
              className="theme-btn-primary px-8 py-3 rounded-xl text-xs font-extrabold transition shadow-lg flex items-center gap-2"
            >
              {submitting ? 'Publishing & Initializing Resources...' : 'Publish Activity Listing 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
