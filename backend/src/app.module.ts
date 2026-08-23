import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { FoodModule } from './food/food.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { SeatsGateway } from './seats/seats.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    // Rate Limiting Guard: Default 60 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
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
    FoodModule,
    ChatbotModule,
  ],
  providers: [
    SeatsGateway,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
