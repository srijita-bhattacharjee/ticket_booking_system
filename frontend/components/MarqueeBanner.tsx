'use client';

interface MarqueeBannerProps {
  direction?: 'left' | 'right';
  items?: string[];
}

export default function MarqueeBanner({
  direction = 'left',
  items = [
    '🔥 HIGH-DEMAND CONCERTS & MOVIES',
    '⚡ ZERO RACE CONDITIONS',
    '⏱️ 10-MINUTE ATOMIC REDIS HOLD LOCKS',
    '🎟️ HMAC-SIGNED QR E-TICKETS',
    '🍿 GOURMET POPCORN & BEVERAGE COMBOS',
    '🏷️ EXCLUSIVE FOOD DISCOUNT COUPONS',
    '🎧 AUTOMATED FIFO WAITLIST REALLOCATION',
  ],
}: MarqueeBannerProps) {
  const content = items.join('   ★   ');
  const animClass = direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right';

  return (
    <div className="w-full overflow-hidden theme-bg-elevated theme-border border-y py-2 text-[11px] font-mono font-extrabold uppercase tracking-widest theme-text-accent selection:bg-none">
      <div className={animClass}>
        <span className="whitespace-nowrap px-4">{content}   ★   </span>
        <span className="whitespace-nowrap px-4">{content}   ★   </span>
      </div>
    </div>
  );
}
