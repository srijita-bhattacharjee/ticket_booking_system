import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.sendPasswordResetOtp(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; otp: string; newPassword?: string; password?: string }) {
    const newPassword = body.newPassword || body.password || '';
    return this.authService.resetPassword(body.email, body.otp, newPassword);
  }

  @Post('send-signup-otp')
  async sendSignupOtp(@Body() dto: RegisterDto) {
    return this.authService.sendSignupOtp(dto);
  }

  @Post('verify-signup-otp')
  async verifySignupOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifySignupOtp(body.email, body.otp);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@GetUser() user: any) {
    return { user };
  }
}
