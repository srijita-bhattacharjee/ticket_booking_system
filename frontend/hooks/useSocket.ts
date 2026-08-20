import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export function useSocket(
  eventId: string | null,
  callbacks: {
    onSeatHeld?: (data: any) => void;
    onSeatReleased?: (data: any) => void;
    onSeatBooked?: (data: any) => void;
    onWaitlistOffer?: (data: any) => void;
  }
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinEventRoom', { eventId });
    });

    if (callbacks.onSeatHeld) socket.on('seat.held', callbacks.onSeatHeld);
    if (callbacks.onSeatReleased) socket.on('seat.released', callbacks.onSeatReleased);
    if (callbacks.onSeatBooked) socket.on('seat.booked', callbacks.onSeatBooked);
    if (callbacks.onWaitlistOffer) socket.on('waitlist.offer_created', callbacks.onWaitlistOffer);

    return () => {
      socket.emit('leaveEventRoom', { eventId });
      socket.disconnect();
    };
  }, [eventId]);

  return socketRef.current;
}
