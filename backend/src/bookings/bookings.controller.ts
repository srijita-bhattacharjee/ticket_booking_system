import { Controller, Post, Get, Delete, Param, Body, Headers, UseGuards } from '@nestjs/common';
import { BookingsService, CreateBookingDto } from './bookings.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/user.decorator';

@Controller('api/bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly waitlistService: WaitlistService,
  ) {}

  @Post()
  async createBooking(
    @GetUser('id') userId: string,
    @Body() dto: CreateBookingDto,
    @Headers('idempotency-key') idempotencyHeader?: string,
  ) {
    return this.bookingsService.createBooking(userId, {
      ...dto,
      idempotencyKey: dto.idempotencyKey || idempotencyHeader,
    });
  }

  @Get()
  async findUserBookings(@GetUser('id') userId: string) {
    return this.bookingsService.findUserBookings(userId);
  }

  @Get(':id')
  async findOne(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.bookingsService.findOne(id, userId);
  }

  @Delete(':id')
  async cancelBooking(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(
      id,
      userId,
      async (eventId, seatIds, category) => {
        await this.waitlistService.processCancelledSeatForWaitlist(eventId, seatIds, category);
      },
    );
  }
}
