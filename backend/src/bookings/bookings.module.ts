import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { SeatsModule } from '../seats/seats.module';
import { TicketsModule } from '../tickets/tickets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaitlistModule } from '../waitlist/waitlist.module';

@Module({
  imports: [TicketsModule, NotificationsModule, WaitlistModule, SeatsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

