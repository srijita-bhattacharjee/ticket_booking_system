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
import { HoldStatus, SeatStatus } from '@prisma/client';

export interface CreateHoldDto {
  eventId: string;
  seatIds: string[]; // event_seat_ids
  ttlMinutes?: number;
}

@Injectable()
export class HoldsService {
  private readonly logger = new Logger(HoldsService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private seatsGateway: SeatsGateway,
  ) {}

  async createHold(userId: string, dto: CreateHoldDto) {
    if (!dto.seatIds || dto.seatIds.length === 0) {
      throw new BadRequestException('At least one seat must be selected');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const ttlMinutes = dto.ttlMinutes || 10;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Acquire Redis locks on seats to fail fast before DB transaction if under high concurrency
    const acquiredLocks: string[] = [];
    for (const seatId of dto.seatIds) {
      const lockKey = `seat-lock:${dto.eventId}:${seatId}`;
      const locked = await this.redisService.acquireLock(lockKey, 10);
      if (!locked) {
        // Release any acquired locks and abort
        for (const key of acquiredLocks) {
          await this.redisService.releaseLock(key);
        }
        throw new ConflictException(`Seat ${seatId} is currently being processed by another user`);
      }
      acquiredLocks.push(lockKey);
    }

    try {
      // Execute PostgreSQL transaction with Row-Level Locking (Pessimistic concurrency control)
      const hold = await this.prisma.$transaction(async (tx) => {
        // Raw query or Prisma FOR UPDATE equivalent to lock targeted seats
        const targetSeats = await tx.$queryRaw<Array<{ id: string; status: SeatStatus; version: number }>>`
          SELECT id, status, version FROM event_seats
          WHERE id IN (${PrismaService.raw(dto.seatIds.map((id) => `'${id}'`).join(','))})
          FOR UPDATE
        `;

        if (targetSeats.length !== dto.seatIds.length) {
          throw new NotFoundException('One or more selected seats were not found for this event');
        }

        // Verify all seats are currently AVAILABLE
        const unavailable = targetSeats.filter((s) => s.status !== SeatStatus.AVAILABLE);
        if (unavailable.length > 0) {
          throw new ConflictException('One or more selected seats are no longer available');
        }

        // Create Hold record
        const newHold = await tx.hold.create({
          data: {
            userId,
            eventId: dto.eventId,
            expiresAt,
            status: HoldStatus.ACTIVE,
            seats: {
              create: dto.seatIds.map((seatId) => ({
                eventSeatId: seatId,
              })),
            },
          },
          include: {
            seats: true,
          },
        });

        // Update target seats status to HELD
        await tx.eventSeat.updateMany({
          where: { id: { in: dto.seatIds } },
          data: {
            status: SeatStatus.HELD,
          },
        });

        return newHold;
      });

      // Save Redis TTL key for automatic expiration monitor
      const redisHoldKey = `hold:${hold.id}`;
      await this.redisService.setKey(redisHoldKey, JSON.stringify({ holdId: hold.id, eventId: dto.eventId, seatIds: dto.seatIds }), ttlMinutes * 60);

      // Broadcast real-time Socket.IO event to all clients on this event map
      this.seatsGateway.notifySeatHeld(dto.eventId, dto.seatIds, userId, expiresAt);

      return {
        holdId: hold.id,
        eventId: dto.eventId,
        seatIds: dto.seatIds,
        expiresAt,
        status: hold.status,
      };
    } finally {
      // Always release temporary Redis lock guards
      for (const lockKey of acquiredLocks) {
        await this.redisService.releaseLock(lockKey);
      }
    }
  }

  async getHoldDetails(holdId: string, userId: string) {
    const hold = await this.prisma.hold.findUnique({
      where: { id: holdId },
      include: {
        event: {
          include: { venue: true },
        },
        seats: {
          include: {
            eventSeat: {
              include: { venueSeat: true },
            },
          },
        },
      },
    });

    if (!hold) throw new NotFoundException('Hold session not found');
    if (hold.userId !== userId) throw new BadRequestException('Hold does not belong to this user');

    // Check if expired
    if (hold.status === HoldStatus.ACTIVE && new Date() > hold.expiresAt) {
      await this.releaseHold(hold.id, HoldStatus.EXPIRED);
      throw new ConflictException('Hold session has expired. Please re-select your seats.');
    }

    return hold;
  }

  async releaseHold(holdId: string, targetStatus: HoldStatus = HoldStatus.RELEASED) {
    const hold = await this.prisma.hold.findUnique({
      where: { id: holdId },
      include: { seats: true },
    });

    if (!hold || hold.status !== HoldStatus.ACTIVE) {
      return;
    }

    const seatIds = hold.seats.map((s) => s.eventSeatId);

    await this.prisma.$transaction(async (tx) => {
      await tx.hold.update({
        where: { id: holdId },
        data: { status: targetStatus },
      });

      // Change HELD seats back to AVAILABLE
      await tx.eventSeat.updateMany({
        where: {
          id: { in: seatIds },
          status: SeatStatus.HELD,
        },
        data: { status: SeatStatus.AVAILABLE },
      });
    });

    // Remove Redis key
    await this.redisService.delKey(`hold:${holdId}`);

    // Notify WebSockets
    this.seatsGateway.notifySeatReleased(hold.eventId, seatIds);

    this.logger.log(`Released hold ${holdId} (Status: ${targetStatus})`);
  }

  async checkAndCleanupExpiredHolds() {
    const expiredHolds = await this.prisma.hold.findMany({
      where: {
        status: HoldStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
    });

    for (const h of expiredHolds) {
      await this.releaseHold(h.id, HoldStatus.EXPIRED);
    }
  }
}
