import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { SeatsGateway } from '../seats/seats.gateway';
import { TicketsModule } from '../tickets/tickets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaitlistModule } from '../waitlist/waitlist.module';

@Module({
  imports: [TicketsModule, NotificationsModule, WaitlistModule],
  controllers: [BookingsController],
  providers: [BookingsService, SeatsGateway],
  exports: [BookingsService],
})
export class BookingsModule {}
