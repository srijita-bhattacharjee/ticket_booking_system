'use client';

import { useState } from 'react';
import {
  ActivityType,
  BookingModel,
  ResourceConfigData,
  ZoneConfig,
  SlotConfig,
  TeamConfig,
  IrregularSeatSection,
} from '../../types/activity';
import { Plus, Trash2, Layers, Clock, Users, Ticket, CheckCircle2, Info } from 'lucide-react';

interface ResourceLayoutEditorProps {
  activityType: ActivityType;
  bookingModel: BookingModel;
  config: ResourceConfigData;
  onChange: (config: ResourceConfigData) => void;
  // Seat grid basic parameters for standard seat builder fallback
  seatRows: number;
  setSeatRows: (rows: number) => void;
  seatsPerRow: number;
  setSeatsPerRow: (seats: number) => void;
  premiumRowsCount: number;
  setPremiumRowsCount: (count: number) => void;
}

export default function ResourceLayoutEditor({
  activityType,
  bookingModel,
  config,
  onChange,
  seatRows,
  setSeatRows,
  seatsPerRow,
  setSeatsPerRow,
  premiumRowsCount,
  setPremiumRowsCount,
}: ResourceLayoutEditorProps) {

  // Default initializers if undefined
  const zones: ZoneConfig[] = config.zones || [
    { id: '1', name: 'General Admission Standing', capacity: 500, price: 50, entryGate: 'Gate A' },
    { id: '2', name: 'VIP Front Standing', capacity: 100, price: 120, entryGate: 'Gate VIP' },
  ];

  const slots: SlotConfig[] = config.slots || [
    { id: '1', startTime: '10:00', endTime: '11:00', durationMinutes: 60, maxCapacity: 10, minPlayers: 2, pricePerPerson: 35 },
    { id: '2', startTime: '11:30', endTime: '12:30', durationMinutes: 60, maxCapacity: 10, minPlayers: 2, pricePerPerson: 35 },
  ];

  const team: TeamConfig = config.team || {
    maxTeams: 16,
    minTeamSize: 5,
    maxTeamSize: 11,
    registrationFee: 250,
  };

  const sections: IrregularSeatSection[] = config.sections || [
    { id: '1', name: 'Main Orchestra', rowsCount: 6, seatsPerRow: 10, category: 'STANDARD', price: 60 },
    { id: '2', name: 'VIP Balcony', rowsCount: 2, seatsPerRow: 8, category: 'VIP', price: 120 },
  ];

  // Helper updates
  const updateZones = (newZones: ZoneConfig[]) => {
    const totalCap = newZones.reduce((sum, z) => sum + (Number(z.capacity) || 0), 0);
    onChange({ ...config, zones: newZones, totalCapacity: totalCap });
  };

  const updateSlots = (newSlots: SlotConfig[]) => {
    const totalCap = newSlots.reduce((sum, s) => sum + (Number(s.maxCapacity) || 0), 0);
    onChange({ ...config, slots: newSlots, totalCapacity: totalCap });
  };

  const updateTeam = (newTeam: TeamConfig) => {
    onChange({ ...config, team: newTeam, totalCapacity: newTeam.maxTeams * newTeam.maxTeamSize });
  };

  const updateSections = (newSections: IrregularSeatSection[]) => {
    const totalCap = newSections.reduce((sum, s) => sum + (Number(s.rowsCount) * Number(s.seatsPerRow)), 0);
    onChange({ ...config, sections: newSections, totalCapacity: totalCap });
  };

  return (
    <div className="space-y-6 theme-bg-elevated theme-border border p-5 rounded-2xl">
      {/* Active Editor Mode Badge */}
      <div className="flex items-center justify-between border-b theme-border pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 theme-text-accent" />
          <div>
            <h4 className="text-sm font-bold theme-text-main">
              Resource Layout Configured for: <span className="theme-text-accent">{activityType}</span> ({bookingModel})
            </h4>
            <p className="text-[11px] theme-text-secondary">
              Dynamically rendering layout controls for {bookingModel} resource model.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full theme-bg-card theme-border border theme-text-main">
          Mode: {bookingModel}
        </span>
      </div>

      {/* Mode 1: SEAT Layout Editor */}
      {bookingModel === 'SEAT' && (
        <div className="space-y-6">
          {/* Option A: Quick Grid Seat Builder */}
          <div className="theme-bg-card p-4 rounded-xl theme-border border space-y-4">
            <h5 className="text-xs font-bold theme-text-main flex items-center gap-1.5">
              <Ticket className="w-4 h-4 theme-text-accent" /> Standard Rectangular Seat Grid
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold theme-text-secondary mb-1">Total Rows</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={seatRows}
                  onChange={(e) => setSeatRows(Number(e.target.value))}
                  className="w-full theme-bg-input theme-border border rounded-xl p-2.5 text-xs theme-text-main focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold theme-text-secondary mb-1">Seats Per Row</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={seatsPerRow}
                  onChange={(e) => setSeatsPerRow(Number(e.target.value))}
                  className="w-full theme-bg-input theme-border border rounded-xl p-2.5 text-xs theme-text-main focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-500 mb-1">Front Premium Rows</label>
                <input
                  type="number"
                  min={0}
                  max={seatRows}
                  value={premiumRowsCount}
                  onChange={(e) => setPremiumRowsCount(Number(e.target.value))}
                  className="w-full theme-bg-input theme-border border rounded-xl p-2.5 text-xs theme-text-main focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] theme-text-secondary">
              Grid total: <strong>{seatRows * seatsPerRow}</strong> seats ({premiumRowsCount * seatsPerRow} Premium, {(seatRows - premiumRowsCount) * seatsPerRow} Standard).
            </p>
          </div>

          {/* Option B: Irregular Seating Sections (Theatre/Concert Auditorium) */}
          <div className="theme-bg-card p-4 rounded-xl theme-border border space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold theme-text-main flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" /> Irregular Seating Sections / Balconies
              </h5>
              <button
                type="button"
                onClick={() =>
                  updateSections([
                    ...sections,
                    {
                      id: String(Date.now()),
                      name: `Section ${sections.length + 1}`,
                      rowsCount: 4,
                      seatsPerRow: 6,
                      category: 'STANDARD',
                      price: 50,
                    },
                  ])
                }
                className="theme-btn-secondary px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section
              </button>
            </div>

            <div className="space-y-3">
              {sections.map((sec, idx) => (
                <div key={sec.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center theme-bg-elevated p-3 rounded-xl border theme-border">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] theme-text-secondary font-bold">Section Name</label>
                    <input
                      type="text"
                      value={sec.name}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx].name = e.target.value;
                        updateSections(updated);
                      }}
                      className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] theme-text-secondary font-bold">Rows</label>
                    <input
                      type="number"
                      min={1}
                      value={sec.rowsCount}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx].rowsCount = Number(e.target.value);
                        updateSections(updated);
                      }}
                      className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] theme-text-secondary font-bold">Seats/Row</label>
                    <input
                      type="number"
                      min={1}
                      value={sec.seatsPerRow}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx].seatsPerRow = Number(e.target.value);
                        updateSections(updated);
                      }}
                      className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] theme-text-secondary font-bold">Tier Category</label>
                    <select
                      value={sec.category}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx].category = e.target.value as any;
                        updateSections(updated);
                      }}
                      className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                    >
                      <option value="STANDARD">STANDARD</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="VIP">VIP</option>
                      <option value="ACCESSIBLE">ACCESSIBLE</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] theme-text-secondary font-bold">Price ($)</label>
                      <input
                        type="number"
                        min={0}
                        value={sec.price}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx].price = Number(e.target.value);
                          updateSections(updated);
                        }}
                        className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                      />
                    </div>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => updateSections(sections.filter((_, i) => i !== idx))}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg mt-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: GENERAL ADMISSION / ZONE CAPACITY */}
      {(bookingModel === 'GENERAL_ADMISSION' || bookingModel === 'CAPACITY') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold theme-text-main flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" /> Standing Zones & Capacity Allocation
              </h5>
              <p className="text-[11px] theme-text-secondary">Configure capacity bounds, zone titles, pricing, and entry gate rules.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateZones([
                  ...zones,
                  {
                    id: String(Date.now()),
                    name: `Zone ${zones.length + 1}`,
                    capacity: 200,
                    price: 45,
                    entryGate: `Gate ${zones.length + 1}`,
                  },
                ])
              }
              className="theme-btn-secondary px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Zone
            </button>
          </div>

          <div className="space-y-3">
            {zones.map((zone, idx) => (
              <div key={zone.id} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center theme-bg-card p-3.5 rounded-xl border theme-border">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] theme-text-secondary font-bold">Zone / Ticket Tier Name</label>
                  <input
                    type="text"
                    value={zone.name}
                    onChange={(e) => {
                      const updated = [...zones];
                      updated[idx].name = e.target.value;
                      updateZones(updated);
                    }}
                    className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                    placeholder="e.g. VIP Front Pit / Standing Zone"
                  />
                </div>
                <div>
                  <label className="block text-[10px] theme-text-secondary font-bold">Max Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={zone.capacity}
                    onChange={(e) => {
                      const updated = [...zones];
                      updated[idx].capacity = Number(e.target.value);
                      updateZones(updated);
                    }}
                    className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] theme-text-secondary font-bold">Price per Spot ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={zone.price}
                    onChange={(e) => {
                      const updated = [...zones];
                      updated[idx].price = Number(e.target.value);
                      updateZones(updated);
                    }}
                    className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] theme-text-secondary font-bold">Entry Gate</label>
                    <input
                      type="text"
                      value={zone.entryGate || ''}
                      onChange={(e) => {
                        const updated = [...zones];
                        updated[idx].entryGate = e.target.value;
                        updateZones(updated);
                      }}
                      className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                      placeholder="e.g. Gate 3"
                    />
                  </div>
                  {zones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => updateZones(zones.filter((_, i) => i !== idx))}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg mt-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="theme-bg-card p-3 rounded-xl theme-border border flex items-center justify-between text-xs font-bold theme-text-main">
            <span>Total General Admission Capacity Across Zones:</span>
            <span className="theme-text-accent text-sm font-black">
              {zones.reduce((sum, z) => sum + (Number(z.capacity) || 0), 0)} Spots
            </span>
          </div>
        </div>
      )}

      {/* Mode 3: TIMED SLOTS */}
      {bookingModel === 'SLOT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold theme-text-main flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" /> Timed Slot Configuration
              </h5>
              <p className="text-[11px] theme-text-secondary">Configure time sessions, duration, per-slot player caps, and pricing.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateSlots([
                  ...slots,
                  {
                    id: String(Date.now()),
                    startTime: '14:00',
                    endTime: '15:00',
                    durationMinutes: 60,
                    maxCapacity: 8,
                    minPlayers: 2,
                    pricePerPerson: 40,
                  },
                ])
              }
              className="theme-btn-secondary px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Timed Slot
            </button>
          </div>

          <div className="space-y-3">
            {slots.map((slot, idx) => (
              <div key={slot.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center theme-bg-card p-3 rounded-xl border theme-border">
                <div>
                  <label className="block text-[10px] theme-text-secondary font-bold">Start Time</label>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => {
                      const updated = [...slots];
                      updated[idx].startTime = e.target.value;
                      updateSlots(updated);
                    }}
                    className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] theme-text-secondary font-bold">End Time</label>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => {
                      const updated = [...slots];
                      updated[idx].endTime = e.target.value;
                      updateSlots(updated);
                    }}
                    className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] theme-text-secondary font-bold">Max Players</label>
                  <input
                    type="number"
                    min={1}
                    value={slot.maxCapacity}
                    onChange={(e) => {
                      const updated = [...slots];
                      updated[idx].maxCapacity = Number(e.target.value);
                      updateSlots(updated);
                    }}
                    className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] theme-text-secondary font-bold">Min Players</label>
                  <input
                    type="number"
                    min={1}
                    value={slot.minPlayers || 1}
                    onChange={(e) => {
                      const updated = [...slots];
                      updated[idx].minPlayers = Number(e.target.value);
                      updateSlots(updated);
                    }}
                    className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] theme-text-secondary font-bold">Price / Person ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={slot.pricePerPerson}
                    onChange={(e) => {
                      const updated = [...slots];
                      updated[idx].pricePerPerson = Number(e.target.value);
                      updateSlots(updated);
                    }}
                    className="w-full theme-bg-input theme-border border rounded-lg p-2 text-xs theme-text-main outline-none"
                  />
                </div>
                <div className="flex items-center justify-end">
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => updateSlots(slots.filter((_, i) => i !== idx))}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg mt-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 4: TEAM REGISTRATION */}
      {bookingModel === 'TEAM' && (
        <div className="theme-bg-card p-4 rounded-xl theme-border border space-y-4">
          <h5 className="text-xs font-bold theme-text-main flex items-center gap-1.5">
            <Users className="w-4 h-4 text-orange-400" /> Team Tournament Registration Controls
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold theme-text-secondary mb-1">Max Teams Allowed</label>
              <input
                type="number"
                min={2}
                value={team.maxTeams}
                onChange={(e) => updateTeam({ ...team, maxTeams: Number(e.target.value) })}
                className="w-full theme-bg-input theme-border border rounded-xl p-2.5 text-xs theme-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold theme-text-secondary mb-1">Min Players / Team</label>
              <input
                type="number"
                min={1}
                value={team.minTeamSize}
                onChange={(e) => updateTeam({ ...team, minTeamSize: Number(e.target.value) })}
                className="w-full theme-bg-input theme-border border rounded-xl p-2.5 text-xs theme-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold theme-text-secondary mb-1">Max Players / Team</label>
              <input
                type="number"
                min={team.minTeamSize}
                value={team.maxTeamSize}
                onChange={(e) => updateTeam({ ...team, maxTeamSize: Number(e.target.value) })}
                className="w-full theme-bg-input theme-border border rounded-xl p-2.5 text-xs theme-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold theme-text-secondary mb-1">Registration Fee / Team ($)</label>
              <input
                type="number"
                min={0}
                value={team.registrationFee}
                onChange={(e) => updateTeam({ ...team, registrationFee: Number(e.target.value) })}
                className="w-full theme-bg-input theme-border border rounded-xl p-2.5 text-xs theme-text-main focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mode 5: TABLE / PASS / CUSTOM */}
      {(bookingModel === 'TABLE' || bookingModel === 'PASS' || bookingModel === 'CUSTOM') && (
        <div className="theme-bg-card p-4 rounded-xl theme-border border space-y-3">
          <h5 className="text-xs font-bold theme-text-main flex items-center gap-1.5">
            <Info className="w-4 h-4 theme-text-accent" /> Custom Resource Allocation Rules
          </h5>
          <div>
            <label className="block text-[11px] font-bold theme-text-secondary mb-1">Total Capacity Pass Limit</label>
            <input
              type="number"
              min={1}
              value={config.totalCapacity || 100}
              onChange={(e) => onChange({ ...config, totalCapacity: Number(e.target.value) })}
              className="w-full theme-bg-input theme-border border rounded-xl p-2.5 text-xs theme-text-main focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold theme-text-secondary mb-1">Resource Notes / Special Rules</label>
            <textarea
              rows={2}
              value={config.notes || ''}
              onChange={(e) => onChange({ ...config, notes: e.target.value })}
              className="w-full theme-bg-input theme-border border rounded-xl p-2 text-xs theme-text-main focus:outline-none"
              placeholder="e.g. VIP Pass includes complimentary food combo & fast-track entry..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
