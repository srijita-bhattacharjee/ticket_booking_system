import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':id')
  async getTicketDetails(@Param('id') id: string) {
    return this.ticketsService.getTicketDetails(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANISER, Role.ADMIN)
  @Post(':id/check-in')
  async checkInTicket(@Param('id') id: string) {
    return this.ticketsService.checkInTicket(id);
  }
}
