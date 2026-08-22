'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { foodService } from '../../services/api';
import { Gift, Tag, Copy, Check, Utensils, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function OffersPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    foodService
      .getCoupons()
      .then((res) => setCoupons(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const defaultCoupons = [
    {
      id: 'c1',
      code: 'POPCORN15',
      discountPercent: 15,
      minSpend: 20,
      isActive: true,
      foodStall: { name: 'Gourmet Snacks & Popcorn', location: 'Section B' },
    },
    {
      id: 'c2',
      code: 'FEAST5',
      discountPercent: 5,
      minSpend: 15,
      isActive: true,
      foodStall: { name: 'Cinema Bistro & Grill', location: 'Food Court' },
    },
  ];

  const displayCoupons = coupons.length > 0 ? coupons : defaultCoupons;

  return (
    <div className="space-y-12 py-4">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase font-mono font-black theme-text-accent px-3 py-1 rounded-full theme-bg-elevated theme-border border inline-flex items-center gap-1.5">
          <Gift className="w-3.5 h-3.5" /> EXCLUSIVE DISCOUNTS & OFFERS
        </span>
        <h1 className="text-3xl sm:text-5xl font-black theme-text-main uppercase">
          Food Partner Promo Coupons
        </h1>
        <p className="text-xs sm:text-sm theme-text-secondary font-medium">
          Copy your favorite food discount codes and apply them at checkout to save on gourmet popcorn, snacks, and beverages!
        </p>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {displayCoupons.map((c) => (
          <div
            key={c.id}
            className="theme-bg-card theme-border border-2 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden transition hover:border-theme-accent group"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl theme-bg-elevated theme-border border theme-text-accent">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base theme-text-main">{c.foodStall?.name || 'Partner Food Stall'}</h3>
                  <span className="text-[11px] theme-text-secondary font-mono">📍 {c.foodStall?.location || 'Main Concourse'}</span>
                </div>
              </div>

              <span className="text-sm font-black theme-btn-primary px-3 py-1 rounded-xl shadow-md font-mono">
                {c.discountPercent ? `${c.discountPercent}% OFF` : `$${c.discountAmount} OFF`}
              </span>
            </div>

            {/* Coupon Details */}
            <div className="space-y-2 text-xs theme-text-secondary border-t theme-border pt-3">
              <p className="flex items-center justify-between">
                <span>Minimum Order Spend:</span>
                <span className="font-bold theme-text-main font-mono">${c.minSpend || 15}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Verification Status:</span>
                <span className="font-bold theme-text-success flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Partnership
                </span>
              </p>
            </div>

            {/* Coupon Code Copy Bar */}
            <div className="flex items-center justify-between gap-3 theme-bg-elevated p-3 rounded-2xl theme-border border">
              <div>
                <span className="text-[10px] theme-text-secondary font-mono block uppercase font-bold">Promo Code</span>
                <span className="text-base font-black font-mono theme-text-accent tracking-widest">{c.code}</span>
              </div>

              <button
                onClick={() => copyToClipboard(c.code)}
                className="theme-btn-primary font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
              >
                {copiedCode === c.code ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Action CTA */}
            <Link
              href="/events"
              className="w-full theme-btn-secondary font-bold py-2.5 rounded-xl transition text-xs text-center block shadow-sm"
            >
              Use Coupon at Checkout &gt;
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
