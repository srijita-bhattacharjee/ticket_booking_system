'use client';

import { useState, useEffect } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
}

export default function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean }>({
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const targetTime = new Date(expiresAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
      } else {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ minutes, seconds, isExpired: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="bg-rose-950/80 border border-rose-600/60 rounded-xl p-3 flex items-center gap-2 text-rose-300 text-sm font-semibold">
        <AlertTriangle className="w-5 h-5 text-rose-400" />
        <span>Seat hold session has expired! Please re-select your seats.</span>
      </div>
    );
  }

  const isLowTime = timeLeft.minutes < 2;

  return (
    <div
      className={`rounded-xl p-3.5 border flex items-center justify-between transition ${
        isLowTime
          ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 animate-pulse'
          : 'bg-slate-900/80 border-slate-800 text-sky-400'
      }`}
    >
      <div className="flex items-center gap-2 font-medium text-sm">
        <Timer className={`w-5 h-5 ${isLowTime ? 'text-amber-400' : 'text-sky-400'}`} />
        <span>Time Remaining on Hold:</span>
      </div>
      <div className="font-mono text-lg font-bold">
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </div>
    </div>
  );
}
