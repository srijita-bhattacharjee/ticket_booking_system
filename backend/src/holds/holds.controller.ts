import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { HoldsService, CreateHoldDto } from './holds.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/user.decorator';

@Controller('api/holds')
@UseGuards(JwtAuthGuard)
export class HoldsController {
  constructor(private readonly holdsService: HoldsService) {}

  @Post()
  async createHold(@GetUser('id') userId: string, @Body() dto: CreateHoldDto) {
    return this.holdsService.createHold(userId, dto);
  }

  @Get(':id')
  async getHoldDetails(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.holdsService.getHoldDetails(id, userId);
  }

  @Delete(':id')
  async cancelHold(@GetUser('id') userId: string, @Param('id') id: string) {
    await this.holdsService.getHoldDetails(id, userId); // verify ownership
    await this.holdsService.releaseHold(id);
    return { success: true, message: 'Hold released successfully' };
  }
}
