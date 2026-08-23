'use client';

import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';

interface SeatItem {
  id: string;
  category: 'PREMIUM' | 'STANDARD';
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  venueSeat: {
    rowNumber: string;
    seatNumber: number;
  };
}

interface SeatMapProps {
  eventId: string;
  seats: SeatItem[];
  selectedSeatIds: string[];
  onSeatToggle: (seatId: string) => void;
}

export default function SeatMap({
  eventId,
  seats: initialSeats,
  selectedSeatIds,
  onSeatToggle,
}: SeatMapProps) {
  const [seatsState, setSeatsState] = useState<SeatItem[]>(initialSeats);

  // Connect real-time WebSockets
  useSocket(eventId, {
    onSeatHeld: (data) => {
      setSeatsState((prev) =>
        prev.map((s) => (data.seatIds.includes(s.id) ? { ...s, status: 'HELD' } : s))
      );
    },
    onSeatReleased: (data) => {
      setSeatsState((prev) =>
        prev.map((s) => (data.seatIds.includes(s.id) ? { ...s, status: 'AVAILABLE' } : s))
      );
    },
    onSeatBooked: (data) => {
      setSeatsState((prev) =>
        prev.map((s) => (data.seatIds.includes(s.id) ? { ...s, status: 'BOOKED' } : s))
      );
    },
  });

  // Group seats by row
  const rowsMap = new Map<string, SeatItem[]>();
  seatsState.forEach((seat) => {
    const row = seat.venueSeat.rowNumber;
    if (!rowsMap.has(row)) rowsMap.set(row, []);
    rowsMap.get(row)!.push(seat);
  });

  const rows = Array.from(rowsMap.entries());

  return (
    <div className="w-full theme-bg-card theme-border border rounded-2xl p-6">
      {/* Screen / Stage Indicator */}
      <div className="mb-10 text-center">
        <div className="w-3/4 mx-auto h-2.5 theme-btn-primary rounded-full shadow-md" />
        <p className="text-[11px] font-bold uppercase tracking-widest theme-text-secondary mt-2">
          SCREEN / STAGE THIS WAY
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded theme-bg-elevated theme-border border" />
          <span className="theme-text-secondary">Standard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded theme-bg-card theme-border border text-theme-accent border-theme-accent flex items-center justify-center text-[9px] font-bold">P</div>
          <span className="theme-text-main">Premium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded theme-btn-primary shadow-sm" />
          <span className="theme-text-main">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded theme-bg-main theme-border border opacity-50" />
          <span className="theme-text-secondary">Held / Booked</span>
        </div>
      </div>

      {/* Seat Grid Layout */}
      <div className="space-y-3 max-w-3xl mx-auto overflow-x-auto pb-4">
        {rows.map(([rowLabel, rowSeats]) => (
          <div key={rowLabel} className="flex items-center justify-center gap-2">
            <span className="w-6 text-center text-xs font-bold theme-text-secondary uppercase">
              {rowLabel}
            </span>

            <div className="flex items-center gap-2">
              {rowSeats.map((seat) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const isHeld = seat.status === 'HELD';
                const isBooked = seat.status === 'BOOKED';
                const isPremium = seat.category === 'PREMIUM';

                let seatStyles = 'theme-bg-elevated theme-border border theme-text-main hover:opacity-80';
                if (isPremium) {
                  seatStyles = 'theme-bg-card theme-border border theme-text-accent font-bold hover:opacity-80';
                }

                if (isSelected) {
                  seatStyles =
                    'theme-btn-primary font-extrabold shadow-md scale-105';
                } else if (isHeld || isBooked) {
                  seatStyles =
                    'theme-bg-main theme-border border theme-text-secondary opacity-40 cursor-not-allowed';
                }

                return (
                  <button
                    key={seat.id}
                    disabled={isHeld || isBooked}
                    onClick={() => onSeatToggle(seat.id)}
                    className={`w-9 h-9 rounded-lg border text-xs font-bold transition flex items-center justify-center ${seatStyles}`}
                    title={`Row ${rowLabel} Seat ${seat.venueSeat.seatNumber} (${seat.category}) - ₹${seat.price}`}
                  >
                    {seat.venueSeat.seatNumber}
                  </button>
                );
              })}
            </div>

            <span className="w-6 text-center text-xs font-bold theme-text-secondary uppercase">
              {rowLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
