import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/user.decorator';
import { Role } from '@prisma/client';

@Controller('api/organiser')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORGANISER, Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardSummary(@GetUser('id') organiserId: string) {
    return this.analyticsService.getOrganiserEventsSummary(organiserId);
  }

  @Get('events/:id/analytics')
  async getEventAnalytics(@Param('id') eventId: string) {
    return this.analyticsService.getEventAnalytics(eventId);
  }

  @Get('events/:id/heatmap')
  async getSeatOccupancyHeatmap(@Param('id') eventId: string) {
    return this.analyticsService.getSeatOccupancyHeatmap(eventId);
  }
}
