'use client';

import { useState } from 'react';
import { waitlistService } from '../services/api';
import { Sparkles, Users, Clock, CheckCircle2 } from 'lucide-react';

interface WaitlistCardProps {
  eventId: string;
  category: 'PREMIUM' | 'STANDARD';
  onJoined?: () => void;
}

export default function WaitlistCard({ eventId, category, onJoined }: WaitlistCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await waitlistService.join(eventId, category);
      setResult(res.data);
      if (onJoined) onJoined();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-bg-card theme-border border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg theme-bg-elevated theme-border border theme-text-accent">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold theme-text-main text-base">{category} Category Sold Out</h4>
            <p className="text-xs theme-text-secondary">Join the automated FIFO reallocation waitlist</p>
          </div>
        </div>
        <span className="text-xs uppercase px-2.5 py-1 rounded-full theme-bg-elevated theme-border border theme-text-accent font-semibold">
          {category}
        </span>
      </div>

      {result ? (
        <div className="space-y-3 theme-bg-elevated theme-border border rounded-xl p-4">
          <div className="flex items-center gap-2 theme-text-success font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully joined waitlist!</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="theme-bg-card p-2.5 rounded-lg theme-border border">
              <span className="theme-text-secondary flex items-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5 theme-text-accent" /> Queue Position
              </span>
              <p className="text-lg font-bold theme-text-main">#{result.position}</p>
            </div>

            <div className="theme-bg-card p-2.5 rounded-lg theme-border border">
              <span className="theme-text-secondary flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Seat Probability
              </span>
              <p className="text-lg font-bold text-amber-500">
                {result.estimatedProbability?.percentage}% ({result.estimatedProbability?.level})
              </p>
            </div>
          </div>

          <p className="text-[11px] theme-text-secondary flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 theme-text-accent" /> Est. Offer Window:{' '}
            {result.estimatedProbability?.estimatedWaitMinutes}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs theme-text-secondary leading-relaxed">
            When a customer cancels a booking in {category}, our engine automatically allocates the seat to you and holds it for 15 minutes.
          </p>

          {error && <p className="text-xs theme-text-accent font-medium">{error}</p>}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full theme-btn-primary font-bold py-2.5 rounded-xl text-sm transition shadow-md"
          >
            {loading ? 'Joining Waitlist...' : `Join ${category} Waitlist`}
          </button>
        </div>
      )}
    </div>
  );
}
