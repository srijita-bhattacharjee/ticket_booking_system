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
    <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-800/40 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-base">{category} Category Sold Out</h4>
            <p className="text-xs text-purple-300">Join the automated FIFO reallocation waitlist</p>
          </div>
        </div>
        <span className="text-xs uppercase px-2.5 py-1 rounded-full bg-purple-900/60 border border-purple-700/60 text-purple-300 font-semibold">
          {category}
        </span>
      </div>

      {result ? (
        <div className="space-y-3 bg-purple-900/20 border border-purple-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully joined waitlist!</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5 text-purple-400" /> Queue Position
              </span>
              <p className="text-lg font-bold text-white">#{result.position}</p>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Seat Probability
              </span>
              <p className="text-lg font-bold text-amber-400">
                {result.estimatedProbability?.percentage}% ({result.estimatedProbability?.level})
              </p>
            </div>
          </div>

          <p className="text-[11px] text-purple-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Est. Offer Window:{' '}
            {result.estimatedProbability?.estimatedWaitMinutes}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            When a customer cancels a booking in {category}, our engine automatically allocates the seat to you and holds it for 15 minutes.
          </p>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-purple-600/20"
          >
            {loading ? 'Joining Waitlist...' : `Join ${category} Waitlist`}
          </button>
        </div>
      )}
    </div>
  );
}
