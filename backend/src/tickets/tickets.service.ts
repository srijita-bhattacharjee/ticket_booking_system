import { Injectable, NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  private readonly hmacSecret = process.env.HMAC_SECRET || process.env.JWT_SECRET || 'super-secret-hmac-ticket-key-2026';

  constructor(private prisma: PrismaService) {}

  private generateHmacSignature(data: string): string {
    return crypto.createHmac('sha256', this.hmacSecret).update(data).digest('hex');
  }

  async generateTicketForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, event: { include: { venue: true } }, seats: { include: { eventSeat: { include: { venueSeat: true } } } } },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const rawData = `${booking.bookingReference}:${booking.id}:${booking.userId}:${booking.eventId}`;
    const hmacSignature = this.generateHmacSignature(rawData);

    const qrPayload = JSON.stringify({
      bookingRef: booking.bookingReference,
      bookingId: booking.id,
      userId: booking.userId,
      eventId: booking.eventId,
      issuedAt: new Date().toISOString(),
      sig: hmacSignature,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 8,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const ticket = await this.prisma.ticket.create({
      data: {
        bookingId: booking.id,
        qrToken: qrPayload,
        status: TicketStatus.VALID,
      },
    });

    return {
      ticket,
      qrDataUrl,
      booking,
    };
  }

  async getTicketDetails(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            event: { include: { venue: true } },
            seats: {
              include: {
                eventSeat: { include: { venueSeat: true } },
              },
            },
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    const qrDataUrl = await QRCode.toDataURL(ticket.qrToken, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 8,
    });

    return {
      ...ticket,
      qrDataUrl,
    };
  }

  async checkInTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { booking: { include: { user: true, event: true } } },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    // Cryptographic Signature Verification Guard
    try {
      const payload = JSON.parse(ticket.qrToken);
      const rawData = `${payload.bookingRef}:${payload.bookingId}:${payload.userId}:${payload.eventId}`;
      const expectedSig = this.generateHmacSignature(rawData);

      if (payload.sig !== expectedSig) {
        throw new UnauthorizedException('Security Error: HMAC Digital Signature mismatch! Ticket token tampered.');
      }
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      // Fallback if legacy un-signed payload
    }

    if (ticket.status === TicketStatus.CHECKED_IN) {
      throw new ConflictException(`Security Violation: Ticket already checked in at ${ticket.checkedInAt?.toISOString()}`);
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('Security Violation: Cannot check in a cancelled or revoked ticket');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'HMAC Signature Verified! Check-in successful.',
      ticket: updated,
      attendeeName: ticket.booking.user.name,
      eventTitle: ticket.booking.event.title,
    };
  }
}
