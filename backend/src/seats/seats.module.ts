import { Module } from '@nestjs/common';
import { SeatsGateway } from './seats.gateway';

@Module({
  providers: [SeatsGateway],
  exports: [SeatsGateway],
})
export class SeatsModule {}
