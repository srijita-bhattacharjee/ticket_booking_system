import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { VenuesModule } from './venues/venues.module';
import { EventsModule } from './events/events.module';
import { HoldsModule } from './holds/holds.module';
import { BookingsModule } from './bookings/bookings.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SeatsGateway } from './seats/seats.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    VenuesModule,
    EventsModule,
    HoldsModule,
    BookingsModule,
    WaitlistModule,
    TicketsModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  providers: [SeatsGateway],
})
export class AppModule {}
