import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { SeatsGateway } from '../seats/seats.gateway';
import { TicketsService } from '../tickets/tickets.service';
import { NotificationsService } from '../notifications/notifications.service';
import { HoldStatus, SeatStatus, BookingStatus } from '@prisma/client';

export interface CreateBookingAddonDto {
  menuItemId: string;
  quantity: number;
  price: number;
}

export interface CreateBookingDto {
  holdId: string;
  idempotencyKey?: string;
  addons?: CreateBookingAddonDto[];
  couponCode?: string;
  discountAmount?: number;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private seatsGateway: SeatsGateway,
    private ticketsService: TicketsService,
    private notificationsService: NotificationsService,
  ) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    // 1. Idempotency Check
    if (dto.idempotencyKey) {
      const cachedBookingId = await this.redisService.getKey(`idempotency:${dto.idempotencyKey}`);
      if (cachedBookingId) {
        this.logger.log(`Idempotency key hit: ${dto.idempotencyKey}`);
        return this.findOne(cachedBookingId, userId);
      }
    }

    // 2. Retrieve & Validate Hold
    const hold = await this.prisma.hold.findUnique({
      where: { id: dto.holdId },
      include: {
        event: true,
        seats: {
          include: {
            eventSeat: { include: { venueSeat: true } },
          },
        },
      },
    });

    if (!hold) throw new NotFoundException('Hold session not found');
    if (hold.userId !== userId) throw new BadRequestException('Hold session does not belong to you');
    if (hold.status !== HoldStatus.ACTIVE) {
      throw new ConflictException(`Hold session is no longer active (Status: ${hold.status})`);
    }
    if (new Date() > hold.expiresAt) {
      throw new ConflictException('Hold session has expired');
    }

    const eventSeatIds = hold.seats.map((s) => s.eventSeatId);
    const seatsTotal = hold.seats.reduce((sum, s) => sum + s.eventSeat.price, 0);
    const addonsTotal = (dto.addons || []).reduce((sum, a) => sum + a.price * a.quantity, 0);
    const discount = dto.discountAmount || 0;
    const finalTotal = Math.max(0, seatsTotal + addonsTotal - discount);
    const bookingRef = 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 3. Database Transaction to convert HELD seats to BOOKED
    const booking = await this.prisma.$transaction(async (tx) => {
      // Create Booking record
      const newBooking = await tx.booking.create({
        data: {
          userId,
          eventId: hold.eventId,
          bookingReference: bookingRef,
          totalAmount: finalTotal,
          discountAmount: discount,
          couponCode: dto.couponCode || null,
          status: BookingStatus.CONFIRMED,
          idempotencyKey: dto.idempotencyKey || null,
          seats: {
            create: eventSeatIds.map((id) => ({
              eventSeatId: id,
            })),
          },
          ...(dto.addons && dto.addons.length > 0
            ? {
                addons: {
                  create: dto.addons.map((a) => ({
                    menuItemId: a.menuItemId,
                    quantity: a.quantity,
                    price: a.price,
                  })),
                },
              }
            : {}),
        },
        include: {
          event: { include: { venue: true } },
          seats: {
            include: {
              eventSeat: { include: { venueSeat: true } },
            },
          },
          addons: {
            include: {
              menuItem: { include: { stall: true } },
            },
          },
        },
      });

      // Mark Hold as COMPLETED
      await tx.hold.update({
        where: { id: hold.id },
        data: { status: HoldStatus.COMPLETED },
      });

      // Update seats to BOOKED
      await tx.eventSeat.updateMany({
        where: { id: { in: eventSeatIds } },
        data: { status: SeatStatus.BOOKED },
      });

      return newBooking;
    });

    // 4. Cache idempotency key if provided
    if (dto.idempotencyKey) {
      await this.redisService.setKey(`idempotency:${dto.idempotencyKey}`, booking.id, 86400); // 24h
    }

    // Remove Redis hold key
    await this.redisService.delKey(`hold:${hold.id}`);

    // 5. Generate QR Ticket
    const ticketResult = await this.ticketsService.generateTicketForBooking(booking.id);

    // 6. Broadcast Socket.IO event `seat.booked`
    this.seatsGateway.notifySeatBooked(hold.eventId, eventSeatIds);

    // 7. Trigger async Email notification with QR code
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const seatsList = booking.seats.map(
        (s) => `Row ${s.eventSeat.venueSeat.rowNumber} - Seat ${s.eventSeat.venueSeat.seatNumber} (${s.eventSeat.category})`
      );
      this.notificationsService.sendTicketEmail(
        user.email,
        user.name,
        booking.bookingReference,
        booking.event.title,
        `${booking.event.eventDate.toDateString()} at ${booking.event.startTime}`,
        seatsList,
        ticketResult.qrDataUrl,
      );
    }

    return {
      booking,
      ticket: ticketResult.ticket,
      qrDataUrl: ticketResult.qrDataUrl,
    };
  }

  async findUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        event: { include: { venue: true } },
        seats: {
          include: {
            eventSeat: { include: { venueSeat: true } },
          },
        },
        addons: {
          include: {
            menuItem: { include: { stall: true } },
          },
        },
        tickets: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(bookingId: string, userId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: { include: { venue: true } },
        seats: {
          include: {
            eventSeat: { include: { venueSeat: true } },
          },
        },
        addons: {
          include: {
            menuItem: { include: { stall: true } },
          },
        },
        tickets: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (userId && booking.userId !== userId) throw new BadRequestException('Unauthorized access to booking');

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string, onWaitlistOfferCallback?: (eventId: string, seatIds: string[], category: string) => Promise<void>) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        seats: {
          include: { eventSeat: true },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new BadRequestException('Booking does not belong to you');
    if (booking.status === BookingStatus.CANCELLED) {
      throw new ConflictException('Booking is already cancelled');
    }

    const eventSeatIds = booking.seats.map((s) => s.eventSeatId);
    const category = booking.seats[0]?.eventSeat.category || 'STANDARD';

    // 1. Transaction to update booking status and set seats to AVAILABLE
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      await tx.eventSeat.updateMany({
        where: { id: { in: eventSeatIds } },
        data: { status: SeatStatus.AVAILABLE },
      });

      await tx.ticket.updateMany({
        where: { bookingId },
        data: { status: 'CANCELLED' },
      });
    });

    // 2. Broadcast WebSocket seat released event
    this.seatsGateway.notifySeatReleased(booking.eventId, eventSeatIds);

    // 3. Trigger Waitlist engine for candidate automatic re-allocation!
    if (onWaitlistOfferCallback) {
      await onWaitlistOfferCallback(booking.eventId, eventSeatIds, category);
    }

    return { success: true, message: 'Booking cancelled successfully. Seats freed for waitlist allocation.' };
  }
}
