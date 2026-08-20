import { Module } from '@nestjs/common';
import { HoldsService } from './holds.service';
import { HoldsController } from './holds.controller';
import { SeatsGateway } from '../seats/seats.gateway';

@Module({
  controllers: [HoldsController],
  providers: [HoldsService, SeatsGateway],
  exports: [HoldsService],
})
export class HoldsModule {}
