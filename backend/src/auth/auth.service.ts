import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../common/redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private redisService: RedisService,
  ) {}

  async sendPasswordResetOtp(email: string) {
    const cleanEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Return success to avoid email enumeration security vulnerability
      return {
        message: 'If the email is registered, a password reset code has been sent.',
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.setKey(`reset-otp:${cleanEmail}`, otp, 600); // 10 minutes TTL

    await this.notificationsService.sendPasswordResetEmail(cleanEmail, user.name, otp);

    return {
      message: 'If the email is registered, a password reset code has been sent.',
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const cleanEmail = email.toLowerCase();
    const cachedOtp = await this.redisService.getKey(`reset-otp:${cleanEmail}`);

    if (!cachedOtp || cachedOtp !== otp.trim()) {
      throw new BadRequestException('Invalid or expired password reset OTP');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email: cleanEmail },
      data: { passwordHash },
    });

    await this.redisService.delKey(`reset-otp:${cleanEmail}`);

    return {
      message: 'Password reset successful. You can now login with your new password.',
    };
  }


  async sendSignupOtp(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email address is already registered');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otpVerification.upsert({
      where: { email },
      update: {
        otp,
        name: dto.name,
        passwordHash,
        role: dto.role || 'CUSTOMER',
        expiresAt,
      },
      create: {
        email,
        otp,
        name: dto.name,
        passwordHash,
        role: dto.role || 'CUSTOMER',
        expiresAt,
      },
    });

    await this.notificationsService.sendOtpEmail(email, dto.name, otp);

    return {
      message: 'Verification OTP sent to your email. Enter the code to activate your account.',
      email,
    };
  }

  async verifySignupOtp(email: string, otp: string) {
    const cleanEmail = email.toLowerCase();
    const record = await this.prisma.otpVerification.findUnique({
      where: { email: cleanEmail },
    });

    if (!record) {
      throw new BadRequestException('No pending OTP verification found for this email address');
    }

    if (record.otp !== otp.trim()) {
      throw new BadRequestException('Invalid verification OTP code');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Verification OTP code has expired. Please request a new OTP.');
    }

    const user = await this.prisma.user.create({
      data: {
        name: record.name,
        email: record.email,
        passwordHash: record.passwordHash,
        role: record.role,
      },
    });

    await this.prisma.otpVerification.delete({ where: { id: record.id } });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email address is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: dto.role || 'CUSTOMER',
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: token,
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }
}
