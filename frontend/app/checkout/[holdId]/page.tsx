'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { holdService, bookingService, foodService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import CountdownTimer from '../../../components/CountdownTimer';
import { CreditCard, ShieldCheck, Ticket, AlertTriangle, Utensils, Tag, Plus, Minus, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const holdId = params.holdId as string;
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [hold, setHold] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingInProcess, setBookingInProcess] = useState(false);
  const [error, setError] = useState('');
  const [idempotencyKey] = useState(() => 'IDEM-' + Math.random().toString(36).substring(2, 10));

  // Food Add-Ons State
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<{ [menuItemId: string]: { quantity: number; price: number; name: string } }>({});

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Auto redirect if user logs out or is unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (holdId) {
      Promise.all([
        holdService.getDetails(holdId),
        foodService.getMenuItems(),
      ])
        .then(([holdRes, menuRes]) => {
          setHold(holdRes.data);
          setMenuItems(menuRes.data);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Hold session has expired or is invalid');
        })
        .finally(() => setLoading(false));
    }
  }, [holdId]);

  const updateAddonQuantity = (item: any, delta: number) => {
    setSelectedAddons((prev) => {
      const currentQty = prev[item.id]?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: {
          quantity: newQty,
          price: item.price,
          name: item.name,
        },
      };
    });
  };

  const seatsList = hold?.seats || [];
  const seatsSubtotal = seatsList.reduce((sum: number, s: any) => sum + (s.eventSeat?.price || 0), 0);
  const addonsSubtotal = Object.values(selectedAddons).reduce((sum, a) => sum + a.price * a.quantity, 0);
  const cartSubtotal = seatsSubtotal + addonsSubtotal;
  const totalPayable = Math.max(0, cartSubtotal - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await foodService.validateCoupon(couponCodeInput.trim(), cartSubtotal);
      setAppliedCoupon(res.data.coupon);
      setCouponDiscount(res.data.discountAmount);
      setCouponMessage({ type: 'success', text: res.data.message });
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage({ type: 'error', text: err.response?.data?.message || 'Invalid coupon code' });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCompleteBooking = async () => {
    setBookingInProcess(true);
    setError('');
    try {
      const addonsPayload = Object.entries(selectedAddons).map(([menuItemId, info]) => ({
        menuItemId,
        quantity: info.quantity,
        price: info.price,
      }));

      const res = await bookingService.create({
        holdId,
        idempotencyKey,
        addons: addonsPayload,
        couponCode: appliedCoupon?.code || undefined,
        discountAmount: couponDiscount > 0 ? couponDiscount : undefined,
      });

      router.push(`/tickets/${res.data.ticket.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking creation failed. Seats may have expired.');
    } finally {
      setBookingInProcess(false);
    }
  };

  if (loading || authLoading) return <div className="text-center py-20 theme-text-secondary text-xs">Verifying hold session & menu combos...</div>;

  if (error && !hold) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-full theme-bg-elevated theme-border border w-fit mx-auto theme-text-accent">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold theme-text-main">Hold Session Expired</h2>
        <p className="text-xs theme-text-secondary">{error}</p>
        <button
          onClick={() => router.push('/events')}
          className="theme-btn-primary font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md"
        >
          Return to Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-extrabold theme-text-main">Checkout & Instant Ticket Claim</h1>
        <p className="text-xs theme-text-secondary">Your seats are locked. Select optional food combos, apply partner coupons, and complete checkout.</p>
      </div>

      {/* Live Countdown Timer */}
      {hold?.expiresAt && (
        <CountdownTimer
          expiresAt={hold.expiresAt}
          onExpire={() => setError('Hold duration expired. Seats released back to availability.')}
        />
      )}

      {error && (
        <div className="theme-bg-elevated theme-border border rounded-xl p-4 flex items-center gap-2 theme-text-accent text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 theme-text-accent" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details & Food Combos Selector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="theme-bg-card theme-border border rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b theme-border pb-4">
              <span className="text-xs font-semibold theme-text-accent uppercase tracking-wider">{hold?.event?.eventType}</span>
              <h2 className="text-2xl font-bold theme-text-main mt-1">{hold?.event?.title}</h2>
              <p className="text-xs theme-text-secondary">Venue: {hold?.event?.venue?.name} • Date: {new Date(hold?.event?.eventDate).toLocaleDateString()}</p>
            </div>

            {/* Reserved Seats List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold theme-text-main flex items-center gap-2">
                <Ticket className="w-4 h-4 theme-text-accent" />
                Reserved Seats
              </h3>
              <div className="space-y-2">
                {seatsList.map((s: any) => (
                  <div
                    key={s.eventSeatId}
                    className="flex items-center justify-between text-xs theme-bg-elevated p-3 rounded-xl theme-border border"
                  >
                    <div>
                      <p className="font-bold theme-text-main">
                        Row {s.eventSeat?.venueSeat?.rowNumber} — Seat {s.eventSeat?.venueSeat?.seatNumber}
                      </p>
                      <span className="text-[10px] theme-text-secondary uppercase font-semibold">{s.eventSeat?.category}</span>
                    </div>
                    <span className="font-bold theme-text-main">${s.eventSeat?.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Food Combos & Add-Ons Selector */}
          <div className="theme-bg-card theme-border border rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b theme-border pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold theme-text-main flex items-center gap-2">
                <Utensils className="w-5 h-5 theme-text-accent" />
                Add-On Food Combos & Beverages (Optional)
              </h3>
              <span className="text-[11px] theme-text-accent theme-bg-elevated px-2.5 py-0.5 rounded-full font-semibold theme-border border">
                Stall Pickup
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuItems.map((item) => {
                const qty = selectedAddons[item.id]?.quantity || 0;
                return (
                  <div
                    key={item.id}
                    className={`theme-bg-elevated theme-border border rounded-2xl p-4 space-y-3 transition flex flex-col justify-between ${
                      qty > 0 ? 'border-theme-accent' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      )}
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-extrabold theme-text-accent px-1.5 py-0.5 rounded theme-bg-card theme-border border">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-bold theme-text-main line-clamp-1">{item.name}</h4>
                        <p className="text-[11px] theme-text-secondary line-clamp-2">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t theme-border">
                      <span className="text-xs font-extrabold theme-text-main">${item.price}</span>

                      <div className="flex items-center gap-2 theme-bg-card theme-border border rounded-xl px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateAddonQuantity(item, -1)}
                          disabled={qty === 0}
                          className="theme-text-secondary hover:theme-text-main disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold theme-text-main px-1.5">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateAddonQuantity(item, 1)}
                          className="theme-text-secondary hover:theme-text-accent"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Summary & Payment Action */}
        <div className="space-y-6">
          <div className="theme-bg-card theme-border border rounded-3xl p-6 space-y-6 sticky top-24">
            <h3 className="text-base font-bold theme-text-main border-b theme-border pb-3">
              Order Summary
            </h3>

            {/* Food Coupons Code Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold theme-text-secondary flex items-center gap-1.5">
                <Tag className="w-4 h-4 theme-text-accent" /> Food Partner Coupon Code
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. POPCORN15"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  className="w-full theme-bg-input theme-border border rounded-xl px-3 py-2 text-xs theme-text-accent font-mono font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon}
                  className="theme-btn-primary font-bold px-4 py-2 rounded-xl text-xs transition shrink-0"
                >
                  Apply
                </button>
              </div>

              {couponMessage && (
                <div
                  className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 ${
                    couponMessage.type === 'success'
                      ? 'theme-bg-elevated theme-border text-theme-success'
                      : 'theme-bg-elevated theme-border text-theme-accent'
                  }`}
                >
                  {couponMessage.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 theme-text-success shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 theme-text-accent shrink-0" />
                  )}
                  <span>{couponMessage.text}</span>
                </div>
              )}
            </div>

            {/* Itemized Pricing Summary */}
            <div className="border-t theme-border pt-4 space-y-2">
              <div className="flex justify-between text-xs theme-text-secondary">
                <span>Seats Subtotal ({seatsList.length})</span>
                <span className="theme-text-main">${seatsSubtotal.toFixed(2)}</span>
              </div>

              {addonsSubtotal > 0 && (
                <div className="flex justify-between text-xs theme-text-accent font-semibold">
                  <span>Food Add-Ons Subtotal</span>
                  <span>+${addonsSubtotal.toFixed(2)}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-xs theme-text-success font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-${couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs theme-text-secondary">
                <span>Booking Fee</span>
                <span className="theme-text-success font-bold">FREE</span>
              </div>

              <div className="flex justify-between text-lg font-extrabold theme-text-main pt-3 border-t theme-border">
                <span>Total Payable</span>
                <span className="theme-text-accent">${totalPayable.toFixed(2)}</span>
              </div>
            </div>

            {/* Concurrency Guard Badge */}
            <div className="theme-bg-elevated p-3 rounded-xl theme-border border flex items-center gap-2 text-[11px] theme-text-secondary">
              <ShieldCheck className="w-4 h-4 theme-text-success shrink-0" />
              <span>Idempotency Protected: <code className="theme-text-accent font-mono">{idempotencyKey}</code></span>
            </div>

            {/* Payment Button */}
            <button
              onClick={handleCompleteBooking}
              disabled={bookingInProcess}
              className="w-full theme-btn-primary font-extrabold py-3.5 rounded-xl transition shadow-md text-sm flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-white" />
              {bookingInProcess ? 'Processing Payment & Generating Ticket...' : `Pay $${totalPayable.toFixed(2)} & Get Tickets`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
