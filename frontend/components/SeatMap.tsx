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
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
      {/* Screen / Stage Indicator */}
      <div className="mb-10 text-center">
        <div className="w-3/4 mx-auto h-2.5 bg-gradient-to-r from-sky-500 via-indigo-400 to-purple-500 rounded-full shadow-lg shadow-sky-500/30" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mt-2">
          SCREEN / STAGE THIS WAY
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-xs font-medium">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500" />
          <span className="text-slate-300">Available Standard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-400" />
          <span className="text-slate-300">Available Premium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-sky-500 border border-sky-400 shadow-md shadow-sky-500/40" />
          <span className="text-slate-300">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-950/80 border border-amber-600/50 animate-pulse" />
          <span className="text-slate-400">Held (10m TTL)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700 opacity-60" />
          <span className="text-slate-500">Booked</span>
        </div>
      </div>

      {/* Seat Grid Layout */}
      <div className="space-y-3 max-w-3xl mx-auto overflow-x-auto pb-4">
        {rows.map(([rowLabel, rowSeats]) => (
          <div key={rowLabel} className="flex items-center justify-center gap-2">
            <span className="w-6 text-center text-xs font-bold text-slate-400 uppercase">
              {rowLabel}
            </span>

            <div className="flex items-center gap-2">
              {rowSeats.map((seat) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const isHeld = seat.status === 'HELD';
                const isBooked = seat.status === 'BOOKED';
                const isPremium = seat.category === 'PREMIUM';

                let seatStyles = 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/30';
                if (isPremium) {
                  seatStyles = 'bg-amber-500/10 border-amber-500/60 text-amber-300 hover:bg-amber-500/30';
                }

                if (isSelected) {
                  seatStyles =
                    'bg-sky-500 text-slate-950 font-extrabold border-sky-300 shadow-lg shadow-sky-500/40 scale-105';
                } else if (isHeld) {
                  seatStyles =
                    'bg-amber-950/60 border-amber-600/40 text-amber-500/50 cursor-not-allowed animate-pulse';
                } else if (isBooked) {
                  seatStyles = 'bg-slate-800/80 border-slate-700/50 text-slate-600 cursor-not-allowed';
                }

                return (
                  <button
                    key={seat.id}
                    disabled={isHeld || isBooked}
                    onClick={() => onSeatToggle(seat.id)}
                    className={`w-9 h-9 rounded-lg border text-xs font-bold transition flex items-center justify-center ${seatStyles}`}
                    title={`Row ${rowLabel} Seat ${seat.venueSeat.seatNumber} (${seat.category}) - $${seat.price}`}
                  >
                    {seat.venueSeat.seatNumber}
                  </button>
                );
              })}
            </div>

            <span className="w-6 text-center text-xs font-bold text-slate-400 uppercase">
              {rowLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
