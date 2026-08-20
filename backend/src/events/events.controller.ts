import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { EventsService, CreateEventDto } from './events.service';
import { EventType } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/user.decorator';
import { Role } from '@prisma/client';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll(@Query('type') type?: EventType, @Query('search') search?: string) {
    return this.eventsService.findAll(type, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANISER, Role.ADMIN)
  @Post()
  async createEvent(@GetUser('id') organiserId: string, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(organiserId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANISER, Role.ADMIN)
  @Delete(':id')
  async deleteEvent(@Param('id') id: string) {
    return this.eventsService.deleteEvent(id);
  }
}
