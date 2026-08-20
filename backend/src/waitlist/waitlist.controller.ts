import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { WaitlistService, JoinWaitlistDto } from './waitlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/user.decorator';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('waitlist')
  async joinWaitlist(@GetUser('id') userId: string, @Body() dto: JoinWaitlistDto) {
    return this.waitlistService.joinWaitlist(userId, dto);
  }

  @Get('events/:eventId/waitlist/status')
  async getWaitlistStatus(@Param('eventId') eventId: string, @GetUser('id') userId: string) {
    return this.waitlistService.getWaitlistStatus(eventId, userId);
  }

  @Post('waitlist/offers/accept')
  async acceptOffer(@GetUser('id') userId: string, @Body('offerToken') offerToken: string) {
    return this.waitlistService.acceptWaitlistOffer(offerToken, userId);
  }
}
