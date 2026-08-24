import { Module } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { SeatsModule } from '../seats/seats.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HoldsModule } from '../holds/holds.module';

@Module({
  imports: [NotificationsModule, HoldsModule, SeatsModule],
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}

