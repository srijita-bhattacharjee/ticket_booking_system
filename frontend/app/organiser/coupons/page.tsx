'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { foodService, eventService } from '../../../services/api';
import { useRouter } from 'next/navigation';
import { Tag, FileCheck, Plus, Upload, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function OrganiserCouponsPage() {
  const router = useRouter();

  const [stalls, setStalls] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [submittingCoupon, setSubmittingCoupon] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Partnership Proof Form
  const [proofForm, setProofForm] = useState({
    foodStallId: '',
    partnerName: '',
    documentUrl: '',
    agreementRef: '',
  });

  // Coupon Form
  const [couponForm, setCouponForm] = useState({
    partnershipId: '',
    eventId: '',
    code: '',
    title: '',
    description: '',
    discountPercent: 15,
    discountAmount: 0,
    minSpend: 10,
    imageUrl: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      foodService.getStalls(),
      foodService.getOrganiserPartnerships(),
      foodService.getOrganiserCoupons(),
      eventService.getAll(),
    ])
      .then(([stallsRes, partRes, couponsRes, eventsRes]) => {
        setStalls(stallsRes.data);
        setPartnerships(partRes.data);
        setCoupons(couponsRes.data);
        setEvents(eventsRes.data);
        if (stallsRes.data.length > 0) {
          setProofForm((prev) => ({ ...prev, foodStallId: stallsRes.data[0].id }));
        }
        if (partRes.data.length > 0) {
          setCouponForm((prev) => ({ ...prev, partnershipId: partRes.data[0].id }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDocumentFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofForm((prev) => ({ ...prev, documentUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProof(true);
    setError('');
    setSuccess('');
    try {
      await foodService.submitPartnershipProof(proofForm);
      setSuccess('Proof of Partnership submitted successfully! Agreement verified.');
      setProofForm({ foodStallId: stalls[0]?.id || '', partnerName: '', documentUrl: '', agreementRef: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit partnership proof');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCoupon(true);
    setError('');
    setSuccess('');
    try {
      await foodService.createCoupon(couponForm);
      setSuccess('Food Coupon created successfully!');
      setCouponForm({
        partnershipId: partnerships[0]?.id || '',
        eventId: '',
        code: '',
        title: '',
        description: '',
        discountPercent: 15,
        discountAmount: 0,
        minSpend: 10,
        imageUrl: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setSubmittingCoupon(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      <button
        onClick={() => router.back()}
        className="text-xs font-semibold theme-text-secondary hover:theme-text-main flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div>
        <h1 className="text-3xl font-extrabold theme-text-main flex items-center gap-2">
          <Tag className="w-8 h-8 theme-text-accent" />
          Organiser Food Partnerships & Coupons Hub
        </h1>
        <p className="text-xs theme-text-secondary">Upload proof of food chain partnerships and issue discount coupons for event attendees</p>
      </div>

      {error && (
        <div className="theme-bg-elevated theme-border border p-4 rounded-xl theme-text-accent text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 theme-text-accent" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="theme-bg-elevated theme-border border p-4 rounded-xl theme-text-success text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 theme-text-success" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 1: Upload Proof of Partnership */}
        <div className="theme-bg-card theme-border border rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-[10px] font-extrabold theme-text-accent uppercase tracking-wider theme-bg-elevated px-2.5 py-1 rounded-full theme-border border">Step 1</span>
            <h3 className="text-xl font-bold theme-text-main mt-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5 theme-text-accent" />
              Upload Proof of Partnership
            </h3>
            <p className="text-xs theme-text-secondary mt-1">Submit agreement reference & contract document to partner with food stalls</p>
          </div>

          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Partner Food Chain / Stall</label>
              <select
                value={proofForm.foodStallId}
                onChange={(e) => setProofForm({ ...proofForm, foodStallId: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              >
                {stalls.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Partner Entity / Chain Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Cinema Gourmet Snacks LLC"
                value={proofForm.partnerName}
                onChange={(e) => setProofForm({ ...proofForm, partnerName: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Agreement Reference Number</label>
              <input
                type="text"
                required
                placeholder="e.g. AGREE-CINEMA-2026-08"
                value={proofForm.agreementRef}
                onChange={(e) => setProofForm({ ...proofForm, agreementRef: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold theme-text-secondary">Contract / Proof Document URL or File</label>
              <input
                type="url"
                placeholder="Document URL (e.g. https://...)"
                value={proofForm.documentUrl}
                onChange={(e) => setProofForm({ ...proofForm, documentUrl: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <span className="text-[10px] theme-text-secondary uppercase font-bold">OR Upload Document File:</span>
                <label className="cursor-pointer theme-btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition">
                  <Upload className="w-3.5 h-3.5 theme-text-accent" /> Browse File
                  <input type="file" onChange={handleDocumentFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingProof}
              className="w-full theme-btn-primary font-bold py-3 rounded-xl transition text-xs shadow-md"
            >
              {submittingProof ? 'Submitting Partnership Document...' : 'Submit Proof of Partnership'}
            </button>
          </form>
        </div>

        {/* Step 2: Issue Food Coupon */}
        <div className="theme-bg-card theme-border border rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-[10px] font-extrabold theme-text-accent uppercase tracking-wider theme-bg-elevated px-2.5 py-1 rounded-full theme-border border">Step 2</span>
            <h3 className="text-xl font-bold theme-text-main mt-2 flex items-center gap-2">
              <Plus className="w-5 h-5 theme-text-accent" />
              Issue Partner Food Coupon / Voucher
            </h3>
            <p className="text-xs theme-text-secondary mt-1">Generate discount vouchers for event attendees using active partnerships</p>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Select Verified Partnership</label>
              <select
                value={couponForm.partnershipId}
                onChange={(e) => setCouponForm({ ...couponForm, partnershipId: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              >
                {partnerships.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partnerName} ({p.foodStall?.name}) — Status: {p.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Target Event (Optional)</label>
              <select
                value={couponForm.eventId}
                onChange={(e) => setCouponForm({ ...couponForm, eventId: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              >
                <option value="">All My Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POPCORN15"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-accent font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold theme-text-secondary mb-1">Discount %</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={couponForm.discountPercent}
                  onChange={(e) => setCouponForm({ ...couponForm, discountPercent: Number(e.target.value) })}
                  className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Coupon Title</label>
              <input
                type="text"
                required
                placeholder="e.g. 15% Off Popcorn & Drinks"
                value={couponForm.title}
                onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold theme-text-secondary mb-1">Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Valid at Cinema Gourmet Snacks counter"
                value={couponForm.description}
                onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                className="w-full theme-bg-input theme-border border rounded-xl p-3 text-xs theme-text-main focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingCoupon || partnerships.length === 0}
              className="w-full theme-btn-primary font-bold py-3 rounded-xl transition text-xs shadow-md"
            >
              {submittingCoupon ? 'Creating Coupon...' : 'Issue Food Coupon'}
            </button>
          </form>
        </div>
      </div>

      {/* Submitted Partnerships Overview */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold theme-text-main flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 theme-text-accent" />
          My Submitted Partnerships ({partnerships.length})
        </h3>

        {loading ? (
          <div className="text-center py-12 theme-text-secondary text-xs">Loading partnerships...</div>
        ) : partnerships.length === 0 ? (
          <div className="theme-bg-card theme-border border rounded-2xl p-8 text-center theme-text-secondary text-xs">
            No food partnerships submitted yet. Use Step 1 above to submit contract agreement documents.
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
                  <p className="text-xs theme-text-secondary">Partner Stall: {p.foodStall?.name}</p>
                </div>

                <p className="text-[11px] theme-text-secondary">Issued Coupons: {p.coupons?.length || 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issued Coupons List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold theme-text-main">Issued Food Coupons ({coupons.length})</h3>

        {coupons.length === 0 ? (
          <div className="theme-bg-card theme-border border rounded-2xl p-8 text-center theme-text-secondary text-xs">
            No active coupons generated yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="theme-bg-card theme-border border rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="theme-badge-accent font-mono text-sm font-extrabold px-3 py-1 rounded-xl">
                    {c.code}
                  </span>
                  <span className="text-xs font-bold theme-text-success">{c.discountPercent ? `${c.discountPercent}% OFF` : `$${c.discountAmount} OFF`}</span>
                </div>

                <div>
                  <h4 className="text-base font-bold theme-text-main">{c.title}</h4>
                  <p className="text-xs theme-text-secondary">{c.description}</p>
                  <p className="text-[11px] theme-text-secondary mt-1">Stall: {c.foodStall?.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
