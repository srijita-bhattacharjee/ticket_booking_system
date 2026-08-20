import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as QRCode from 'qrcode';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async generateTicketForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, event: { include: { venue: true } }, seats: { include: { eventSeat: { include: { venueSeat: true } } } } },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const qrPayload = JSON.stringify({
      bookingRef: booking.bookingReference,
      bookingId: booking.id,
      userId: booking.userId,
      eventId: booking.eventId,
      issuedAt: new Date().toISOString(),
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

    if (ticket.status === TicketStatus.CHECKED_IN) {
      throw new ConflictException(`Ticket already checked in at ${ticket.checkedInAt?.toISOString()}`);
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('Cannot check in a cancelled ticket');
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
      message: 'Check-in successful! Access granted.',
      ticket: updated,
      attendeeName: ticket.booking.user.name,
      eventTitle: ticket.booking.event.title,
    };
  }
}
