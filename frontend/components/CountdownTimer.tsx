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
      <div className="theme-bg-elevated theme-border border rounded-xl p-3.5 flex items-center gap-2 theme-text-accent text-xs font-semibold">
        <AlertTriangle className="w-5 h-5 theme-text-accent" />
        <span>Seat hold session has expired! Please re-select your seats.</span>
      </div>
    );
  }

  return (
    <div className="theme-bg-card theme-border border-2 rounded-xl p-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2 font-medium text-xs theme-text-main">
        <Timer className="w-5 h-5 theme-text-accent animate-bounce" />
        <span className="font-bold">Time Remaining on Hold:</span>
      </div>
      <div className="flex items-center gap-1 font-mono text-lg font-black theme-text-accent">
        <span className="theme-bg-elevated px-2.5 py-1 rounded-lg theme-border border shadow-inner">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span>:</span>
        <span className="theme-bg-elevated px-2.5 py-1 rounded-lg theme-border border shadow-inner animate-pulse">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
