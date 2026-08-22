import { Injectable, NotFoundException } from '@nestjs/common';
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

    // Calculate dynamic available seat count
    const eventsWithAvailability = await Promise.all(
      events.map(async (ev) => {
        const availableSeats = await this.prisma.eventSeat.count({
          where: { eventId: ev.id, status: SeatStatus.AVAILABLE },
        });
        const totalSeats = await this.prisma.eventSeat.count({
          where: { eventId: ev.id },
        });
        return {
          ...ev,
          availableSeats,
          totalSeats,
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
