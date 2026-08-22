import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Helmet HTTP Security Headers (Anti-Clickjacking, Anti-XSS, Anti-MIME Sniffing)
  app.use(helmet());

  // 2. Hardened CORS Security Configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 3. Strict Input Validation & Payload Sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Ticket Booking System API running on http://localhost:${port}`);
  logger.log(`🛡️ Security Enabled: Helmet Headers + Throttler Guard + CORS Restrictions`);
}

bootstrap();
