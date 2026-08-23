'use client';

import { useEffect } from 'react';
import { X, Play } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl?: string | null;
  title?: string;
}

export default function TrailerModal({
  isOpen,
  onClose,
  trailerUrl,
  title = 'Watch Trailer',
}: TrailerModalProps) {

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !trailerUrl) return null;

  // Convert YouTube / Vimeo links into secure embed URLs
  const getEmbedUrl = (rawUrl: string): string | null => {
    try {
      if (rawUrl.includes('youtube.com/watch')) {
        const urlObj = new URL(rawUrl);
        const v = urlObj.searchParams.get('v');
        return v ? `https://www.youtube.com/embed/${v}?autoplay=1` : null;
      }
      if (rawUrl.includes('youtu.be/')) {
        const id = rawUrl.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
      }
      if (rawUrl.includes('youtube.com/embed/')) {
        return rawUrl.includes('?') ? `${rawUrl}&autoplay=1` : `${rawUrl}?autoplay=1`;
      }
      if (rawUrl.includes('vimeo.com/')) {
        const id = rawUrl.split('vimeo.com/')[1]?.split('?')[0];
        return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const embedUrl = getEmbedUrl(trailerUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-modal-title"
    >
      <div
        className="relative w-full max-w-4xl theme-bg-card theme-border border rounded-2xl overflow-hidden shadow-2xl space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 theme-bg-elevated theme-border border-b">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 theme-text-accent fill-current" />
            <h3 id="trailer-modal-title" className="text-sm sm:text-base font-extrabold theme-text-main">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full theme-bg-card theme-text-secondary hover:theme-text-main hover:theme-bg-input transition"
            aria-label="Close trailer modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Iframe Container */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-center p-8 theme-text-secondary text-sm space-y-2">
              <p>⚠️ Trailer video unavailable or external URL untrusted.</p>
              <p className="text-xs">Only YouTube and Vimeo video streams can be securely embedded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
