'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { analyticsService } from '../../../services/api';
import SeatHeatmap from '../../../components/SeatHeatmap';
import { DollarSign, Ticket, TrendingUp, Users, PlusCircle, Flame } from 'lucide-react';

export default function OrganiserDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  useEffect(() => {
    analyticsService
      .getDashboard()
      .then((res) => {
        setSummary(res.data);
        if (res.data.eventSummaries?.length > 0) {
          setSelectedEventId(res.data.eventSummaries[0].eventId);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      setLoadingHeatmap(true);
      analyticsService
        .getHeatmap(selectedEventId)
        .then((res) => setHeatmapData(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingHeatmap(false));
    }
  }, [selectedEventId]);

  if (loading) return <div className="text-center py-20 theme-text-secondary text-xs">Loading organiser metrics...</div>;

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold theme-text-main">Organiser Revenue & Analytics</h1>
          <p className="text-xs theme-text-secondary">Track ticket sales, seat occupancy, cancellation metrics & heatmaps</p>
        </div>
        <Link
          href="/organiser/events/create"
          className="theme-btn-primary font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          Create New Event
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="theme-bg-card theme-border border p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between theme-text-secondary text-xs font-semibold">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 theme-text-success" />
          </div>
          <p className="text-3xl font-extrabold theme-text-success">${summary?.totalRevenue?.toFixed(2) || '0.00'}</p>
          <span className="text-[11px] theme-text-success font-medium">+14% vs previous show</span>
        </div>

        <div className="theme-bg-card theme-border border p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between theme-text-secondary text-xs font-semibold">
            <span>Total Tickets Sold</span>
            <Ticket className="w-4 h-4 theme-text-accent" />
          </div>
          <p className="text-3xl font-extrabold theme-text-main">{summary?.totalTicketsSold || 0}</p>
          <span className="text-[11px] theme-text-accent font-medium">Confirmed bookings</span>
        </div>

        <div className="theme-bg-card theme-border border p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between theme-text-secondary text-xs font-semibold">
            <span>Average Occupancy</span>
            <TrendingUp className="w-4 h-4 theme-text-accent" />
          </div>
          <p className="text-3xl font-extrabold theme-text-main">{summary?.averageOccupancy || 0}%</p>
          <span className="text-[11px] theme-text-accent font-medium">Venue fill capacity</span>
        </div>

        <div className="theme-bg-card theme-border border p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between theme-text-secondary text-xs font-semibold">
            <span>Active Listings</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold theme-text-main">{summary?.totalEvents || 0}</p>
          <span className="text-[11px] text-amber-500 font-medium">On-sale events</span>
        </div>
      </div>

      {/* Events Summary Table */}
      <div className="theme-bg-card theme-border border rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold theme-text-main">Event Performance Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs theme-text-main">
            <thead className="border-b theme-border uppercase text-[10px] theme-text-secondary theme-bg-elevated">
              <tr>
                <th className="p-3">Event Title</th>
                <th className="p-3">Venue</th>
                <th className="p-3">Tickets Sold</th>
                <th className="p-3">Occupancy %</th>
                <th className="p-3">Revenue</th>
                <th className="p-3">Waitlist Queue</th>
                <th className="p-3 text-right">Heatmap</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {summary?.eventSummaries?.map((ev: any) => (
                <tr key={ev.eventId} className="hover:theme-bg-elevated transition">
                  <td className="p-3 font-bold theme-text-main">{ev.title}</td>
                  <td className="p-3 theme-text-secondary">{ev.venueName}</td>
                  <td className="p-3 font-semibold">{ev.ticketsSold} / {ev.totalSeats}</td>
                  <td className="p-3 font-bold theme-text-accent">{ev.occupancyRate}%</td>
                  <td className="p-3 font-bold theme-text-success">${ev.totalRevenue?.toFixed(2)}</td>
                  <td className="p-3">
                    <span className="theme-badge-accent px-2 py-0.5 rounded font-semibold text-[11px]">
                      {ev.waitlistDemand} Waiting
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedEventId(ev.eventId)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto ${
                        selectedEventId === ev.eventId
                          ? 'theme-btn-primary'
                          : 'theme-btn-secondary'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      View Heatmap
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seat Occupancy Heatmap Section */}
      {selectedEventId && (
        <div className="space-y-4">
          {loadingHeatmap ? (
            <div className="text-center py-12 theme-text-secondary text-xs">Loading seat occupancy heatmap...</div>
          ) : heatmapData ? (
            <SeatHeatmap rows={heatmapData.rows || []} />
          ) : null}
        </div>
      )}
    </div>
  );
}
