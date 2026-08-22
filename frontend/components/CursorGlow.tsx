'use client';

import { useEffect, useState } from 'react';

export default function CursorGlow() {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ x: -200, y: -200 });

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 w-96 h-96 rounded-full opacity-25 blur-3xl transition-transform duration-100 ease-out"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${pos.x - 192}px, ${pos.y - 192}px, 0)`,
        background: 'radial-gradient(circle, var(--primary-accent) 0%, rgba(245, 158, 11, 0.4) 40%, transparent 70%)',
      }}
    />
  );
}
