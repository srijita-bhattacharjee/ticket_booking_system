import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SeatCategory } from '@prisma/client';

export interface CreateVenueDto {
  name: string;
  location: string;
  imageUrl?: string;
  activityType?: string;
  bookingModel?: string;
  hallName?: string;
  rows?: number;
  seatsPerRow?: number;
  premiumRowsCount?: number;
  resourceConfig?: string;
}

@Injectable()
export class VenuesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.venue.findMany({
      include: {
        halls: true,
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
        halls: true,
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
        imageUrl: dto.imageUrl || null,
        createdById: adminId,
      },
    });

    // Create Hall
    const hall = await this.prisma.venueHall.create({
      data: {
        venueId: venue.id,
        name: dto.hallName || 'Main Hall / Screen 1',
        capacity: 0,
      },
    });

    let config: any = {};
    if (dto.resourceConfig) {
      try {
        config = JSON.parse(dto.resourceConfig);
      } catch {
        config = {};
      }
    }

    const seatsToCreate = [];

    // Mode A: Irregular Seating Sections specified in config
    if (config.sections && Array.isArray(config.sections) && config.sections.length > 0) {
      let sectionIndex = 0;
      for (const sec of config.sections) {
        const secRows = Math.min(sec.rowsCount || 4, 15);
        const secSeats = Math.min(sec.seatsPerRow || 8, 30);
        const cat = (sec.category as SeatCategory) || SeatCategory.STANDARD;
        const rowPrefix = String.fromCharCode(65 + sectionIndex); // A, B, C...

        for (let r = 0; r < secRows; r++) {
          const rowLabel = `${rowPrefix}${r + 1}`;
          for (let s = 1; s <= secSeats; s++) {
            seatsToCreate.push({
              venueId: venue.id,
              hallId: hall.id,
              section: sec.name || `Section ${sectionIndex + 1}`,
              rowNumber: rowLabel,
              seatNumber: s,
              category: cat,
            });
          }
        }
        sectionIndex++;
      }
    }
    // Mode B: General Admission / Standing Zones or Slots specified in config
    else if (config.zones && Array.isArray(config.zones) && config.zones.length > 0) {
      for (const zone of config.zones) {
        const zoneCap = Math.min(zone.capacity || 50, 1000);
        const zoneName = (zone.name || 'GA').substring(0, 10);
        for (let s = 1; s <= zoneCap; s++) {
          seatsToCreate.push({
            venueId: venue.id,
            hallId: hall.id,
            section: zone.name || 'General Admission',
            rowNumber: zoneName,
            seatNumber: s,
            category: SeatCategory.STANDARD,
          });
        }
      }
    }
    // Mode C: Standard Grid Fallback
    else {
      const rowsLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      const totalRows = Math.min(dto.rows || 6, rowsLabels.length);
      const seatsPerRow = Math.min(dto.seatsPerRow || 8, 20);
      const premiumCount = dto.premiumRowsCount || 2;

      for (let r = 0; r < totalRows; r++) {
        const rowLabel = rowsLabels[r];
        const category = r < premiumCount ? SeatCategory.PREMIUM : SeatCategory.STANDARD;
        for (let s = 1; s <= seatsPerRow; s++) {
          seatsToCreate.push({
            venueId: venue.id,
            hallId: hall.id,
            section: 'Main Section',
            rowNumber: rowLabel,
            seatNumber: s,
            category,
          });
        }
      }
    }

    if (seatsToCreate.length > 0) {
      await this.prisma.venueSeat.createMany({
        data: seatsToCreate,
      });
    }

    return this.findOne(venue.id);
  }

  async deleteVenue(id: string) {
    await this.findOne(id);
    return this.prisma.venue.delete({ where: { id } });
  }
}
