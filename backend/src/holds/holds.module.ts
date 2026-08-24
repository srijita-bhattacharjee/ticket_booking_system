import { Module } from '@nestjs/common';
import { HoldsService } from './holds.service';
import { HoldsController } from './holds.controller';
import { SeatsModule } from '../seats/seats.module';

@Module({
  imports: [SeatsModule],
  controllers: [HoldsController],
  providers: [HoldsService],
  exports: [HoldsService],
})
export class HoldsModule {}

