import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SeatStatus, BookingStatus, WaitlistStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOrganiserEventsSummary(organiserId: string) {
    const events = await this.prisma.event.findMany({
      where: { organiserId },
      include: { venue: true },
    });

    const summaries = await Promise.all(
      events.map((ev) => this.getEventAnalytics(ev.id))
    );

    const totalRevenue = summaries.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalTicketsSold = summaries.reduce((sum, s) => sum + s.ticketsSold, 0);
    const averageOccupancy = summaries.length > 0
      ? Math.round(summaries.reduce((sum, s) => sum + s.occupancyRate, 0) / summaries.length)
      : 0;

    return {
      totalEvents: events.length,
      totalRevenue,
      totalTicketsSold,
      averageOccupancy,
      eventSummaries: summaries,
    };
  }

  async getEventAnalytics(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { venue: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const totalSeats = await this.prisma.eventSeat.count({ where: { eventId } });
    const bookedSeatsCount = await this.prisma.eventSeat.count({
      where: { eventId, status: SeatStatus.BOOKED },
    });
    const heldSeatsCount = await this.prisma.eventSeat.count({
      where: { eventId, status: SeatStatus.HELD },
    });
    const availableSeatsCount = await this.prisma.eventSeat.count({
      where: { eventId, status: SeatStatus.AVAILABLE },
    });

    // Calculate revenue from confirmed bookings
    const confirmedBookings = await this.prisma.booking.findMany({
      where: { eventId, status: BookingStatus.CONFIRMED },
    });
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const cancelledBookingsCount = await this.prisma.booking.count({
      where: { eventId, status: BookingStatus.CANCELLED },
    });
    const totalBookingsAttempted = confirmedBookings.length + cancelledBookingsCount;
    const cancellationRate = totalBookingsAttempted > 0
      ? Math.round((cancelledBookingsCount / totalBookingsAttempted) * 100)
      : 0;

    const waitlistDemand = await this.prisma.waitlistEntry.count({
      where: { eventId, status: { in: [WaitlistStatus.WAITING, WaitlistStatus.OFFERED] } },
    });

    const occupancyRate = totalSeats > 0 ? Math.round((bookedSeatsCount / totalSeats) * 100) : 0;

    return {
      eventId: event.id,
      title: event.title,
      venueName: event.venue.name,
      eventDate: event.eventDate,
      totalSeats,
      ticketsSold: bookedSeatsCount,
      heldSeats: heldSeatsCount,
      availableSeats: availableSeatsCount,
      totalRevenue,
      occupancyRate,
      cancellationRate,
      waitlistDemand,
    };
  }

  async getSeatOccupancyHeatmap(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { venue: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const seats = await this.prisma.eventSeat.findMany({
      where: { eventId },
      include: { venueSeat: true },
      orderBy: [
        { venueSeat: { rowNumber: 'asc' } },
        { venueSeat: { seatNumber: 'asc' } },
      ],
    });

    // Structure grid rows
    const gridMap = new Map<string, any[]>();
    for (const seat of seats) {
      const row = seat.venueSeat.rowNumber;
      if (!gridMap.has(row)) {
        gridMap.set(row, []);
      }

      // Assign occupancy intensity score (0 = Available, 1 = Held, 2 = Booked Premium, 3 = High Demand Booked)
      let heatScore = 0;
      if (seat.status === SeatStatus.HELD) heatScore = 1;
      else if (seat.status === SeatStatus.BOOKED) heatScore = seat.category === 'PREMIUM' ? 3 : 2;

      gridMap.get(row).push({
        seatId: seat.id,
        rowNumber: seat.venueSeat.rowNumber,
        seatNumber: seat.venueSeat.seatNumber,
        category: seat.category,
        price: seat.price,
        status: seat.status,
        heatScore,
      });
    }

    const rowsArray = Array.from(gridMap.entries()).map(([rowLabel, seatsInRow]) => ({
      rowLabel,
      seats: seatsInRow,
    }));

    return {
      eventId: event.id,
      title: event.title,
      rows: rowsArray,
    };
  }
}
