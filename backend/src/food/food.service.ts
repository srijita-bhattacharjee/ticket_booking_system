import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PartnershipStatus } from '@prisma/client';

export interface CreateFoodStallDto {
  name: string;
  description: string;
  location: string;
  venueId?: string;
  imageUrl?: string;
}

export interface CreateMenuItemDto {
  stallId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
}

export interface CreatePartnershipProofDto {
  foodStallId: string;
  partnerName: string;
  documentUrl: string;
  agreementRef: string;
}

export interface CreateCouponDto {
  partnershipId: string;
  eventId?: string;
  code: string;
  title: string;
  description: string;
  discountPercent?: number;
  discountAmount?: number;
  minSpend?: number;
  imageUrl?: string;
}

@Injectable()
export class FoodService {
  constructor(private prisma: PrismaService) {}

  // --- ADMIN: FOOD STALLS & MENUS ---
  async createFoodStall(dto: CreateFoodStallDto) {
    return this.prisma.foodStall.create({
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        venueId: dto.venueId || null,
        imageUrl: dto.imageUrl || null,
      },
      include: { items: true, venue: true },
    });
  }

  async getAllFoodStalls() {
    return this.prisma.foodStall.findMany({
      include: {
        items: true,
        venue: true,
        _count: { select: { items: true, partnerships: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFoodStall(id: string) {
    return this.prisma.foodStall.delete({ where: { id } });
  }

  async addMenuItem(dto: CreateMenuItemDto) {
    const stall = await this.prisma.foodStall.findUnique({ where: { id: dto.stallId } });
    if (!stall) throw new NotFoundException('Food stall not found');

    return this.prisma.menuItem.create({
      data: {
        stallId: dto.stallId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        price: dto.price,
        imageUrl: dto.imageUrl || null,
      },
    });
  }

  async deleteMenuItem(id: string) {
    return this.prisma.menuItem.delete({ where: { id } });
  }

  async getAllMenuItems() {
    return this.prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: { stall: true },
      orderBy: { price: 'asc' },
    });
  }

  // --- ORGANISER: PARTNERSHIP PROOFS ---
  async submitPartnershipProof(organiserId: string, dto: CreatePartnershipProofDto) {
    const stall = await this.prisma.foodStall.findUnique({ where: { id: dto.foodStallId } });
    if (!stall) throw new NotFoundException('Food stall not found');

    return this.prisma.partnershipProof.create({
      data: {
        organiserId,
        foodStallId: dto.foodStallId,
        partnerName: dto.partnerName,
        documentUrl: dto.documentUrl,
        agreementRef: dto.agreementRef,
        status: PartnershipStatus.APPROVED, // Auto-approve upon document submission or set to APPROVED
      },
      include: { foodStall: true },
    });
  }

  async getOrganiserPartnerships(organiserId: string) {
    return this.prisma.partnershipProof.findMany({
      where: { organiserId },
      include: { foodStall: true, coupons: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPartnerships() {
    return this.prisma.partnershipProof.findMany({
      include: { organiser: { select: { id: true, name: true, email: true } }, foodStall: true, coupons: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePartnershipStatus(id: string, status: PartnershipStatus, notes?: string) {
    return this.prisma.partnershipProof.update({
      where: { id },
      data: { status, notes: notes || null },
    });
  }

  // --- ORGANISER: FOOD COUPONS ---
  async createCoupon(organiserId: string, dto: CreateCouponDto) {
    const partnership = await this.prisma.partnershipProof.findUnique({
      where: { id: dto.partnershipId },
    });

    if (!partnership) throw new NotFoundException('Partnership record not found');
    if (partnership.organiserId !== organiserId) {
      throw new BadRequestException('Partnership document does not belong to you');
    }
    if (partnership.status !== PartnershipStatus.APPROVED) {
      throw new BadRequestException('Partnership proof document has not been verified/approved by Admin yet');
    }

    const existingCode = await this.prisma.foodCoupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existingCode) throw new ConflictException('Coupon code already exists');

    return this.prisma.foodCoupon.create({
      data: {
        partnershipId: dto.partnershipId,
        foodStallId: partnership.foodStallId,
        eventId: dto.eventId || null,
        code: dto.code.toUpperCase(),
        title: dto.title,
        description: dto.description,
        discountPercent: dto.discountPercent || null,
        discountAmount: dto.discountAmount || null,
        minSpend: dto.minSpend || 0,
        imageUrl: dto.imageUrl || null,
      },
      include: { foodStall: true, event: true },
    });
  }

  async getOrganiserCoupons(organiserId: string) {
    return this.prisma.foodCoupon.findMany({
      where: { partnership: { organiserId } },
      include: { foodStall: true, event: true, partnership: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllActiveCoupons() {
    return this.prisma.foodCoupon.findMany({
      where: { isActive: true },
      include: { foodStall: true, event: true },
    });
  }

  async validateCoupon(code: string, cartTotal: number) {
    const coupon = await this.prisma.foodCoupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { foodStall: true },
    });

    if (!coupon || !coupon.isActive) {
      throw new NotFoundException('Invalid or expired coupon code');
    }

    if (cartTotal < coupon.minSpend) {
      throw new BadRequestException(`Minimum spend of $${coupon.minSpend} required to use coupon ${code}`);
    }

    let calculatedDiscount = 0;
    if (coupon.discountAmount) {
      calculatedDiscount = coupon.discountAmount;
    } else if (coupon.discountPercent) {
      calculatedDiscount = (cartTotal * coupon.discountPercent) / 100;
    }

    return {
      valid: true,
      coupon,
      discountAmount: Number(calculatedDiscount.toFixed(2)),
      message: `Coupon ${coupon.code} applied! Saved $${calculatedDiscount.toFixed(2)}`,
    };
  }
}
