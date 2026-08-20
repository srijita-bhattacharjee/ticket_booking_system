import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { VenuesService, CreateVenueDto } from './venues.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/user.decorator';
import { Role } from '@prisma/client';

@Controller('api/admin/venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  async findAll() {
    return this.venuesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async createVenue(@GetUser('id') adminId: string, @Body() dto: CreateVenueDto) {
    return this.venuesService.createVenue(adminId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteVenue(@Param('id') id: string) {
    return this.venuesService.deleteVenue(id);
  }
}
