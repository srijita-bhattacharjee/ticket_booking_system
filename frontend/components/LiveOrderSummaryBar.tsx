'use client';

import { Ticket, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface LiveOrderSummaryBarProps {
  selectedTier: string;
  selectedSpots: number[];
  pricePerSpot: number;
  onLockIn?: () => void;
}

export default function LiveOrderSummaryBar({
  selectedTier,
  selectedSpots,
  pricePerSpot,
  onLockIn,
}: LiveOrderSummaryBarProps) {
  const totalSpotsCount = selectedSpots.length;
  const totalPrice = totalSpotsCount * pricePerSpot;

  if (totalSpotsCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl theme-bg-card theme-border border-2 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-float-slow flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl theme-btn-primary shadow-md">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-extrabold uppercase theme-text-accent">
              {selectedTier} TIER
            </span>
            <span className="text-[10px] theme-badge-success px-2 py-0.5 rounded-full font-bold">
              {totalSpotsCount} Spot{totalSpotsCount > 1 ? 's' : ''} Picked
            </span>
          </div>
          <p className="text-xs theme-text-secondary font-mono">
            Spots: {selectedSpots.map((s) => `#${s}`).join(', ')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="text-[10px] uppercase theme-text-secondary font-mono block">Total Locked</span>
          <p className="text-xl font-mono font-extrabold theme-text-accent">₹{totalPrice.toFixed(2)}</p>
        </div>

        <button
          onClick={onLockIn}
          className="theme-btn-primary font-extrabold px-5 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition"
        >
          Lock In Ticket
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
