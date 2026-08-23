'use client';

interface MarqueeBannerProps {
  direction?: 'left' | 'right';
  items?: string[];
}

export default function MarqueeBanner({
  direction = 'left',
  items = [
    '🎬 NEW RELEASES & BLOCKBUSTER MOVIES',
    '🎤 LIVE MUSIC CONCERTS & FESTIVALS',
    '🎭 EXCLUSIVE THEATRE SHOWS & PLAYS',
    '🍿 GOURMET SNACK & BEVERAGE COMBOS',
    '🎟️ SPECIAL FAN DISCOUNT OFFERS',
    '⚡ INSTANT DIGITAL QR ENTRY PASSES',
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
