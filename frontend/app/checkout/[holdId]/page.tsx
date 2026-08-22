'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { holdService, bookingService, foodService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import CountdownTimer from '../../../components/CountdownTimer';
import RazorpayPaymentModal from '../../../components/RazorpayPaymentModal';
import { ShieldCheck, Ticket, AlertTriangle, Utensils, Tag, Plus, Minus, CheckCircle2 } from 'lucide-react';

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
          console.error(err);
          setError(err.response?.data?.message || 'Failed to load hold session details');
        })
        .finally(() => setLoading(false));
    }
  }, [holdId]);

  const updateAddonQty = (item: any, delta: number) => {
    setSelectedAddons((prev) => {
      const current = prev[item.id]?.quantity || 0;
      const nextQty = Math.max(0, current + delta);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: {
          quantity: nextQty,
          price: item.price,
          name: item.name,
        },
      };
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const seatsSum = (hold?.seats || []).reduce((acc: number, s: any) => acc + s.eventSeat.price, 0);
      const res = await foodService.validateCoupon(couponCodeInput.trim(), seatsSum);
      const couponObj = res.data.coupon || res.data;
      const discount = res.data.discountAmount !== undefined ? res.data.discountAmount : ((seatsSum * (couponObj.discountPercent || 0)) / 100);
      const percentStr = couponObj.discountPercent ? `${couponObj.discountPercent}%` : `$${discount}`;

      setAppliedCoupon(couponObj);
      setCouponDiscount(discount);

      setCouponMessage({
        type: 'success',
        text: `Coupon "${couponObj.code}" applied! Saved $${discount.toFixed(2)} (${percentStr} off)`,
      });
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage({
        type: 'error',
        text: err.response?.data?.message || 'Invalid or expired coupon code',
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const seatsList = hold?.seats || [];
  const seatsSubtotal = seatsList.reduce((acc: number, s: any) => acc + s.eventSeat.price, 0);
  const addonsSubtotal = Object.values(selectedAddons).reduce((acc: any, a: any) => acc + a.price * a.quantity, 0);
  const totalPayable = Math.max(0, seatsSubtotal + addonsSubtotal - couponDiscount);

  const handleRazorpayPaymentSuccess = async (rzpPayload: any) => {
    setBookingInProcess(true);
    setError('');

    try {
      const formattedAddons = Object.entries(selectedAddons).map(([menuItemId, item]) => ({
        menuItemId,
        quantity: item.quantity,
        price: item.price,
      }));

      const res = await bookingService.verifyRazorpayPayment({
        holdId,
        razorpay_order_id: rzpPayload.razorpay_order_id,
        razorpay_payment_id: rzpPayload.razorpay_payment_id,
        razorpay_signature: rzpPayload.razorpay_signature,
        idempotencyKey,
        addons: formattedAddons,
        couponCode: appliedCoupon?.code || undefined,
        discountAmount: couponDiscount,
      });

      const ticketId = res.data.ticket?.id || res.data.tickets?.[0]?.id;

      if (ticketId) {
        router.push(`/tickets/${ticketId}`);
      } else {
        router.push(`/bookings`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Razorpay payment verification failed');
      setBookingInProcess(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="text-center py-20 theme-text-secondary font-mono text-xs">
        Initializing secure hold session...
      </div>
    );
  }

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
                    className="theme-bg-elevated theme-border border rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs theme-text-main line-clamp-1">{item.name}</h4>
                        <span className="font-extrabold text-xs theme-text-accent">${item.price}</span>
                      </div>
                      <p className="text-[10px] theme-text-secondary line-clamp-2">{item.description || 'Fresh gourmet cinema snack'}</p>
                      <span className="text-[10px] theme-text-secondary font-mono block">Stall: {item.stall?.name}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t theme-border">
                      <span className="text-[11px] font-semibold theme-text-secondary">Quantity</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateAddonQty(item, -1)}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded-lg theme-bg-card theme-border border flex items-center justify-center text-xs font-bold theme-text-main hover:opacity-80 disabled:opacity-30 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs theme-text-main">{qty}</span>
                        <button
                          onClick={() => updateAddonQty(item, 1)}
                          className="w-7 h-7 rounded-lg theme-btn-primary flex items-center justify-center text-xs font-bold text-white shadow-sm transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary & Razorpay Payment Gateway Component */}
        <div className="space-y-6">
          <div className="theme-bg-card theme-border border rounded-3xl p-5 sm:p-7 space-y-6 overflow-hidden">
            <h3 className="text-lg font-bold theme-text-main border-b theme-border pb-3">Order Summary</h3>

            {/* Food Partner Coupon Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold theme-text-main flex items-center gap-1.5">
                <Tag className="w-4 h-4 theme-text-accent" />
                Food Partner Promo Coupon
              </label>

              <div className="flex items-center gap-2 w-full overflow-hidden">
                <input
                  type="text"
                  placeholder="e.g. POPCORN15 or FEAST5"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  className="min-w-0 flex-1 px-3 py-2 text-xs rounded-xl theme-bg-elevated theme-border border theme-text-main focus:outline-none focus:border-theme-accent font-mono uppercase"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCodeInput.trim()}
                  className="theme-btn-primary font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm disabled:opacity-50 shrink-0"
                >
                  {validatingCoupon ? 'Validating...' : 'Apply'}
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
          </div>

          {/* Razorpay Interactive Payment Gateway Component */}
          <RazorpayPaymentModal
            holdId={holdId}
            totalAmount={totalPayable}
            onPaymentSuccess={handleRazorpayPaymentSuccess}
            isProcessing={bookingInProcess}
          />
        </div>
      </div>
    </div>
  );
}
