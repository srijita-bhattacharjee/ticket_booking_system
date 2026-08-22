import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  FoodService,
  CreateFoodStallDto,
  CreateMenuItemDto,
  CreatePartnershipProofDto,
  CreateCouponDto,
} from './food.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/user.decorator';
import { PartnershipStatus } from '@prisma/client';

@Controller('api/food')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  // --- PUBLIC ENDPOINTS ---
  @Get('menu-items')
  async getAllMenuItems() {
    return this.foodService.getAllMenuItems();
  }

  @Get('stalls')
  async getAllStalls() {
    return this.foodService.getAllFoodStalls();
  }

  @Get('coupons')
  async getAllActiveCoupons() {
    return this.foodService.getAllActiveCoupons();
  }

  @Post('coupons/validate')
  async validateCoupon(@Body() body: { code: string; cartTotal: number }) {
    return this.foodService.validateCoupon(body.code, body.cartTotal || 0);
  }

  // --- ADMIN ENDPOINTS ---
  @UseGuards(JwtAuthGuard)
  @Post('admin/stalls')
  async createFoodStall(@Body() dto: CreateFoodStallDto) {
    return this.foodService.createFoodStall(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/stalls/:id')
  async deleteFoodStall(@Param('id') id: string) {
    return this.foodService.deleteFoodStall(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/menu-items')
  async addMenuItem(@Body() dto: CreateMenuItemDto) {
    return this.foodService.addMenuItem(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/menu-items/:id')
  async deleteMenuItem(@Param('id') id: string) {
    return this.foodService.deleteMenuItem(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/partnerships')
  async getAllPartnerships() {
    return this.foodService.getAllPartnerships();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/partnerships/:id/status')
  async updatePartnershipStatus(
    @Param('id') id: string,
    @Body() body: { status: PartnershipStatus; notes?: string },
  ) {
    return this.foodService.updatePartnershipStatus(id, body.status, body.notes);
  }

  // --- ORGANISER ENDPOINTS ---
  @UseGuards(JwtAuthGuard)
  @Post('organiser/partnerships')
  async submitPartnershipProof(
    @GetUser('id') organiserId: string,
    @Body() dto: CreatePartnershipProofDto,
  ) {
    return this.foodService.submitPartnershipProof(organiserId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('organiser/partnerships')
  async getOrganiserPartnerships(@GetUser('id') organiserId: string) {
    return this.foodService.getOrganiserPartnerships(organiserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('organiser/coupons')
  async createCoupon(
    @GetUser('id') organiserId: string,
    @Body() dto: CreateCouponDto,
  ) {
    return this.foodService.createCoupon(organiserId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('organiser/coupons')
  async getOrganiserCoupons(@GetUser('id') organiserId: string) {
    return this.foodService.getOrganiserCoupons(organiserId);
  }
}
