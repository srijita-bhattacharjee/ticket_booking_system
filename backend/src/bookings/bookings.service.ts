import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { SeatsGateway } from '../seats/seats.gateway';
import { TicketsService } from '../tickets/tickets.service';
import { NotificationsService } from '../notifications/notifications.service';
import { HoldStatus, SeatStatus, BookingStatus } from '@prisma/client';
import * as crypto from 'crypto';

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

  /**
   * STEP 1: Create Razorpay Order
   * Endpoint: POST /api/bookings/create-order
   * Calculates amount in paise (minimum 100 paise = ₹1)
   */
  async createRazorpayOrder(userId: string, holdId: string, amount: number) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new UnauthorizedException('Razorpay credentials missing in server environment');
    }

    const amountInPaise = Math.max(100, Math.round(amount * 100));

    try {
      const Razorpay = require('razorpay');
      const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
      
      const order = await instance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: 'rcpt_' + (holdId ? holdId.substring(0, 10) : Math.random().toString(36).substring(2, 10)),
        notes: { holdId, userId },
      });

      return {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId,
      };
    } catch (err: any) {
      this.logger.error(`Razorpay Order Creation Failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException(err.message || 'Failed to create Razorpay Order');
    }
  }

  /**
   * STEP 3: Verify Razorpay Payment Signature
   * Endpoint: POST /api/bookings/verify-payment
   * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
   */
  async verifyRazorpayPayment(
    userId: string,
    dto: {
      holdId: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      idempotencyKey?: string;
      addons?: CreateBookingAddonDto[];
      couponCode?: string;
      discountAmount?: number;
    },
  ) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new UnauthorizedException('Razorpay Secret Key missing on server');
    }

    if (!dto.razorpay_order_id || !dto.razorpay_payment_id || !dto.razorpay_signature) {
      throw new BadRequestException('Missing required Razorpay payment verification fields');
    }

    // Generate expected HMAC-SHA256 signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${dto.razorpay_order_id}|${dto.razorpay_payment_id}`)
      .digest('hex');

    // Strict signature comparison
    if (generatedSignature !== dto.razorpay_signature) {
      this.logger.warn(`Razorpay Signature Mismatch! Generated: ${generatedSignature}, Received: ${dto.razorpay_signature}`);
      throw new BadRequestException('Payment verification failed: Invalid Razorpay cryptographic signature');
    }

    this.logger.log(`Razorpay Payment Signature Verified Successfully for Payment ${dto.razorpay_payment_id}`);

    // Signature verified! Atomically confirm booking inside database
    return this.createBooking(userId, {
      holdId: dto.holdId,
      idempotencyKey: dto.idempotencyKey || `RZP-${dto.razorpay_payment_id}`,
      addons: dto.addons,
      couponCode: dto.couponCode,
      discountAmount: dto.discountAmount,
    });
  }

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

    if (hold.status === HoldStatus.COMPLETED) {
      const existingBooking = await this.prisma.booking.findFirst({
        where: { userId, eventId: hold.eventId },
        orderBy: { createdAt: 'desc' },
        include: {
          event: { include: { venue: true } },
          seats: { include: { eventSeat: { include: { venueSeat: true } } } },
          tickets: true,
        },
      });
      if (existingBooking) {
        const ticketResult = await this.ticketsService.generateTicketForBooking(existingBooking.id);
        return {
          booking: existingBooking,
          ticket: ticketResult.ticket,
          qrDataUrl: ticketResult.qrDataUrl,
        };
      }
    }

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
    const booking = await this.prisma.$transaction(
      async (tx) => {
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
      },
      {
        maxWait: 15000, // wait up to 15s to get a connection from the pool
        timeout: 30000, // allow up to 30s for the transaction to complete
      },
    );


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
        event: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new BadRequestException('Booking does not belong to you');
    if (booking.status === BookingStatus.CANCELLED) {
      throw new ConflictException('Booking is already cancelled');
    }

    // ─── Cancellation Policy: 24-hour rule ───────────────────────────────────
    const now = new Date();
    const eventStart = new Date(booking.event.eventDate);

    // Combine event date + startTime string (e.g. "18:00") for precise enforcement
    const [hours, minutes] = booking.event.startTime.split(':').map(Number);
    eventStart.setHours(hours ?? 0, minutes ?? 0, 0, 0);

    const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilEvent < 0) {
      throw new BadRequestException('Cannot cancel a booking for an event that has already passed.');
    }

    const refundEligible = hoursUntilEvent >= 24;
    // ─────────────────────────────────────────────────────────────────────────

    const eventSeatIds = booking.seats.map((s) => s.eventSeatId);
    const category = booking.seats[0]?.eventSeat.category || 'STANDARD';

    // 1. Transaction to update booking status and set seats to AVAILABLE
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: now,
          refundEligible,
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

    this.logger.log(
      `Booking ${bookingId} cancelled. Hours until event: ${hoursUntilEvent.toFixed(1)}h. Refund eligible: ${refundEligible}`,
    );

    // 2. Broadcast WebSocket seat released event
    this.seatsGateway.notifySeatReleased(booking.eventId, eventSeatIds);

    // 3. Trigger Waitlist engine for candidate automatic re-allocation!
    if (onWaitlistOfferCallback) {
      await onWaitlistOfferCallback(booking.eventId, eventSeatIds, category);
    }

    const message = refundEligible
      ? 'Booking cancelled successfully. A refund will be processed within 5–7 business days.'
      : 'Booking cancelled. This cancellation is within 24 hours of the event and is not eligible for a refund.';

    return {
      success: true,
      refundEligible,
      refundAmount: refundEligible ? booking.totalAmount : 0,
      hoursUntilEvent: Math.round(hoursUntilEvent),
      message,
    };
  }
}

