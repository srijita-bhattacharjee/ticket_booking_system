import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/user.decorator';

@Controller('api/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':eventId')
  toggle(@GetUser('id') userId: string, @Param('eventId') eventId: string) {
    return this.wishlistService.toggle(userId, eventId);
  }

  @Get('ids')
  getIds(@GetUser('id') userId: string) {
    return this.wishlistService.getWishlistedIds(userId);
  }

  @Get()
  getWishlist(@GetUser('id') userId: string) {
    return this.wishlistService.getWishlist(userId);
  }
}
