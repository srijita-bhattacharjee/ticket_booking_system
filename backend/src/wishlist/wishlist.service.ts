import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(userId: string, eventId: string): Promise<{ wishlisted: boolean }> {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { wishlisted: false };
    }
    await this.prisma.wishlist.create({ data: { userId, eventId } });
    return { wishlisted: true };
  }

  async getWishlistedIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.wishlist.findMany({
      where: { userId },
      select: { eventId: true },
    });
    return rows.map((r) => r.eventId);
  }

  async getWishlist(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            venue: true,
            seats: { take: 1, orderBy: { price: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
