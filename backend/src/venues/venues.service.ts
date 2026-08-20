import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SeatCategory } from '@prisma/client';

export interface CreateVenueDto {
  name: string;
  location: string;
  rows: number;
  seatsPerRow: number;
  premiumRowsCount?: number;
}

@Injectable()
export class VenuesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.venue.findMany({
      include: {
        seats: true,
        _count: {
          select: { seats: true, events: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        seats: {
          orderBy: [
            { rowNumber: 'asc' },
            { seatNumber: 'asc' },
          ],
        },
      },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async createVenue(adminId: string, dto: CreateVenueDto) {
    const venue = await this.prisma.venue.create({
      data: {
        name: dto.name,
        location: dto.location,
        createdById: adminId,
      },
    });

    const rowsLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const totalRows = Math.min(dto.rows || 6, rowsLabels.length);
    const seatsPerRow = Math.min(dto.seatsPerRow || 8, 20);
    const premiumCount = dto.premiumRowsCount || 2;

    const seatsToCreate = [];
    for (let r = 0; r < totalRows; r++) {
      const rowLabel = rowsLabels[r];
      const category = r < premiumCount ? SeatCategory.PREMIUM : SeatCategory.STANDARD;
      for (let s = 1; s <= seatsPerRow; s++) {
        seatsToCreate.push({
          venueId: venue.id,
          rowNumber: rowLabel,
          seatNumber: s,
          category,
        });
      }
    }

    await this.prisma.venueSeat.createMany({
      data: seatsToCreate,
    });

    return this.findOne(venue.id);
  }

  async deleteVenue(id: string) {
    await this.findOne(id);
    return this.prisma.venue.delete({ where: { id } });
  }
}
