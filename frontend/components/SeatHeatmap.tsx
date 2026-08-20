'use client';

interface SeatHeatItem {
  seatId: string;
  rowNumber: string;
  seatNumber: number;
  category: string;
  price: number;
  status: string;
  heatScore: number;
}

interface HeatmapRow {
  rowLabel: string;
  seats: SeatHeatItem[];
}

interface SeatHeatmapProps {
  rows: HeatmapRow[];
}

export default function SeatHeatmap({ rows }: SeatHeatmapProps) {
  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Visual Seat Occupancy Heatmap</h3>
          <p className="text-xs text-slate-400">Real-time seat popularity and demand intensity grid</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
            <span className="text-slate-400">Empty (0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-500/40 border border-amber-400" />
            <span className="text-amber-300">Held (1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-sky-500/50 border border-sky-400" />
            <span className="text-sky-300">Standard Booked (2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-purple-500 border border-purple-300 shadow-md shadow-purple-500/50" />
            <span className="text-purple-300">Premium High Demand (3)</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-w-4xl mx-auto overflow-x-auto pb-4">
        {rows.map((r) => (
          <div key={r.rowLabel} className="flex items-center justify-center gap-2">
            <span className="w-6 text-center text-xs font-bold text-slate-400 uppercase">
              {r.rowLabel}
            </span>

            <div className="flex items-center gap-2">
              {r.seats.map((seat) => {
                let heatColor = 'bg-slate-800/80 border-slate-700 text-slate-500';
                if (seat.heatScore === 1) {
                  heatColor = 'bg-amber-500/30 border-amber-400 text-amber-200 animate-pulse';
                } else if (seat.heatScore === 2) {
                  heatColor = 'bg-sky-500/40 border-sky-400 text-sky-100 font-bold';
                } else if (seat.heatScore === 3) {
                  heatColor = 'bg-purple-500 border-purple-300 text-white font-extrabold shadow-lg shadow-purple-500/40 scale-105';
                }

                return (
                  <div
                    key={seat.seatId}
                    className={`w-8 h-8 rounded-md border text-[11px] flex items-center justify-center transition cursor-default ${heatColor}`}
                    title={`Row ${seat.rowNumber} Seat ${seat.seatNumber} (${seat.category}) - Heat Score: ${seat.heatScore}`}
                  >
                    {seat.seatNumber}
                  </div>
                );
              })}
            </div>

            <span className="w-6 text-center text-xs font-bold text-slate-400 uppercase">
              {r.rowLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
