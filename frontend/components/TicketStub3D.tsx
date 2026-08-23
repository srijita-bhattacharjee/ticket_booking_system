'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Ticket, Film, Music, Star, MapPin } from 'lucide-react';

interface TicketStub3DProps {
  event: any;
  tier?: 'GENERAL' | 'VIP' | 'BACKSTAGE';
  onSelectTier?: (tier: string, price: number) => void;
}

export default function TicketStub3D({ event, tier = 'GENERAL', onSelectTier }: TicketStub3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const price = tier === 'VIP' ? 85 : tier === 'BACKSTAGE' ? 150 : 35;
  const displayImage = event?.imageUrl || event?.venue?.imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 animate-float-slow transition-transform duration-200 ease-out"
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isHovered ? 1.03 : 1})`,
      }}
    >
      <div className="relative group theme-bg-card theme-border border rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between select-none border-dashed border-2">
        {/* Metallic Sheen Sweep Animation */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 transform -skew-x-12 animate-sheen" />

        {/* Top Poster Image */}
        <div className="h-44 w-full relative theme-bg-main overflow-hidden">
          <img src={displayImage} alt={event?.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Tier Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full theme-btn-primary shadow-md">
              {tier} TICKET
            </span>
          </div>

          <span className="absolute top-3 right-3 text-[11px] font-mono font-extrabold text-amber-400 bg-black/70 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-400/30 backdrop-blur-md">
            <Star className="w-3 h-3 fill-amber-400" /> ⭐ 9.3
          </span>
        </div>

        {/* Middle Content */}
        <div className="p-5 space-y-3">
          <h3 className="text-lg font-extrabold theme-text-main group-hover:theme-text-accent transition line-clamp-1">
            {event?.title}
          </h3>
          <p className="text-xs theme-text-secondary flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 theme-text-accent" />
            {event?.venue?.name || 'Metropolitan Arena'}
          </p>
        </div>

        {/* Torn-Edge Perforated Dashed Divider */}
        <div className="relative flex items-center justify-between px-2 my-1">
          <div className="w-4 h-4 rounded-full theme-bg-main border-r theme-border -ml-4" />
          <div className="flex-1 border-b-2 border-dashed theme-border mx-2" />
          <div className="w-4 h-4 rounded-full theme-bg-main border-l theme-border -mr-4" />
        </div>

        {/* Bottom Stub Price & Lock-in Button */}
        <div className="p-5 pt-2 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase theme-text-secondary font-mono block">Price</span>
            <p className="text-xl font-mono font-extrabold theme-text-accent">₹{price}</p>
          </div>

          {onSelectTier ? (
            <button
              onClick={() => onSelectTier(tier, price)}
              className="theme-btn-primary font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition"
            >
              Select Spot
            </button>
          ) : (
            <Link
              href={`/events/${event?.id}`}
              className="theme-btn-primary font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1"
            >
              <Ticket className="w-3.5 h-3.5" /> Select Seats
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
