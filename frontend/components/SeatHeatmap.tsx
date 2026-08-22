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
    <div className="w-full theme-bg-card theme-border border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold theme-text-main">Visual Seat Occupancy Heatmap</h3>
          <p className="text-xs theme-text-secondary">Real-time seat popularity and demand intensity grid</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded theme-bg-main theme-border border" />
            <span className="theme-text-secondary">Available (0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded theme-bg-elevated theme-border border text-amber-500 font-bold flex items-center justify-center text-[9px]">1</div>
            <span className="theme-text-secondary">Held (1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded theme-bg-elevated theme-border border theme-text-success font-bold flex items-center justify-center text-[9px]">2</div>
            <span className="theme-text-success">Standard Booked (2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded theme-btn-primary shadow-sm flex items-center justify-center text-[9px] font-extrabold">3</div>
            <span className="theme-text-accent">High Demand (3)</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-w-4xl mx-auto overflow-x-auto pb-4">
        {rows.map((r) => (
          <div key={r.rowLabel} className="flex items-center justify-center gap-2">
            <span className="w-6 text-center text-xs font-bold theme-text-secondary uppercase">
              {r.rowLabel}
            </span>

            <div className="flex items-center gap-2">
              {r.seats.map((seat) => {
                let heatColor = 'theme-bg-main theme-border border theme-text-secondary';
                if (seat.heatScore === 1) {
                  heatColor = 'theme-bg-elevated theme-border border text-amber-500 font-semibold';
                } else if (seat.heatScore === 2) {
                  heatColor = 'theme-bg-elevated theme-border border theme-text-success font-bold';
                } else if (seat.heatScore === 3) {
                  heatColor = 'theme-btn-primary font-extrabold shadow-sm scale-105';
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

            <span className="w-6 text-center text-xs font-bold theme-text-secondary uppercase">
              {r.rowLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
