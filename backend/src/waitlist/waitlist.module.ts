import { Module } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { SeatsGateway } from '../seats/seats.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { HoldsModule } from '../holds/holds.module';

@Module({
  imports: [NotificationsModule, HoldsModule],
  controllers: [WaitlistController],
  providers: [WaitlistService, SeatsGateway],
  exports: [WaitlistService],
})
export class WaitlistModule {}
