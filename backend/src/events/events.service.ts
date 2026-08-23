import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EventType, EventStatus, SeatCategory, SeatStatus } from '@prisma/client';

export interface CreateEventDto {
  venueId: string;
  title: string;
  description: string;
  eventType: EventType;
  eventDate: string;
  startTime: string;
  imageUrl?: string;
  trailerUrl?: string;
  premiumPrice: number;
  standardPrice: number;
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: EventType, search?: string) {
    const where: any = {};
    if (type) where.eventType = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { name: { contains: search, mode: 'insensitive' } } },
        { venue: { location: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        venue: true,
        organiser: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { seats: true, bookings: true },
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    // Filter out events that are 10 minutes past their start time
    const now = new Date();
    const activeEvents = events.filter((ev) => {
      const start = new Date(ev.eventDate);
      if (ev.startTime) {
        const [h, m] = ev.startTime.split(':').map(Number);
        start.setHours(h ?? 0, m ?? 0, 0, 0);
      }
      const tenMinsPastStart = new Date(start.getTime() + 10 * 60 * 1000);
      return now <= tenMinsPastStart;
    });

    // Calculate dynamic available seat count and minimum starting price
    const eventsWithAvailability = await Promise.all(
      activeEvents.map(async (ev) => {
        const availableSeats = await this.prisma.eventSeat.count({
          where: { eventId: ev.id, status: SeatStatus.AVAILABLE },
        });
        const totalSeats = await this.prisma.eventSeat.count({
          where: { eventId: ev.id },
        });
        const minSeat = await this.prisma.eventSeat.findFirst({
          where: { eventId: ev.id },
          orderBy: { price: 'asc' },
          select: { price: true },
        });

        return {
          ...ev,
          availableSeats,
          totalSeats,
          startingPrice: minSeat?.price || 15,
          isSoldOut: availableSeats === 0,
        };
      })
    );

    return eventsWithAvailability;
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        venue: {
          include: {
            seats: true,
          },
        },
        organiser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!event) throw new NotFoundException('Event not found');

    const seats = await this.prisma.eventSeat.findMany({
      where: { eventId: id },
      include: {
        venueSeat: true,
      },
      orderBy: [
        { venueSeat: { rowNumber: 'asc' } },
        { venueSeat: { seatNumber: 'asc' } },
      ],
    });

    const availableSeats = seats.filter((s) => s.status === SeatStatus.AVAILABLE).length;

    return {
      ...event,
      seats,
      availableSeats,
      totalSeats: seats.length,
      isSoldOut: availableSeats === 0,
    };
  }

  async createEvent(organiserId: string, dto: CreateEventDto) {
    // Enforce 3-day (72-hour) advance scheduling rule
    const now = new Date();
    const scheduledTime = new Date(dto.eventDate);
    if (dto.startTime) {
      const [h, m] = dto.startTime.split(':').map(Number);
      scheduledTime.setHours(h ?? 0, m ?? 0, 0, 0);
    }
    const minScheduledTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    if (scheduledTime < minScheduledTime) {
      throw new BadRequestException(
        'Event must be scheduled at least 3 days (72 hours) in advance of the start time.',
      );
    }

    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
      include: { seats: true },
    });
    if (!venue) throw new NotFoundException('Venue not found');

    const event = await this.prisma.event.create({
      data: {
        organiserId,
        venueId: dto.venueId,
        title: dto.title,
        description: dto.description,
        eventType: dto.eventType,
        eventDate: new Date(dto.eventDate),
        startTime: dto.startTime,
        imageUrl: dto.imageUrl || null,
        trailerUrl: dto.trailerUrl || null,
        status: EventStatus.ON_SALE,
      },
    });

    // Populate event seats per venue seat layout
    const eventSeats = venue.seats.map((vs) => ({
      eventId: event.id,
      venueSeatId: vs.id,
      category: vs.category,
      price: vs.category === SeatCategory.PREMIUM ? (dto.premiumPrice || 50) : (dto.standardPrice || 30),
      status: SeatStatus.AVAILABLE,
    }));

    await this.prisma.eventSeat.createMany({
      data: eventSeats,
    });

    return this.findOne(event.id);
  }

  async deleteEvent(id: string) {
    await this.findOne(id);
    return this.prisma.event.delete({ where: { id } });
  }
}
