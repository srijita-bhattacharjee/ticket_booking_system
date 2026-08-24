import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug'],
  });

  // Trust reverse proxy headers (required for Railway, Render, Heroku)
  // so that rate-limiting and IP detection work correctly behind load balancers
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // 1. Response Compression (gzip) — reduces payload size significantly in production
  app.use(compression());

  // 2. Helmet HTTP Security Headers
  // Content-Security-Policy, anti-clickjacking, HSTS, MIME sniffing protection
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https:'],
              },
            }
          : false,
    }),
  );

  // 3. CORS — only allow whitelisted origins in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Idempotency-Key',
    ],
  });

  // 4. Strict Input Validation & Payload Sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 5. Graceful shutdown hooks (critical for Railway/Render zero-downtime deploys)
  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT || '4000', 10);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 TicketVerse API running on port ${port} [${process.env.NODE_ENV || 'development'}]`);
  logger.log(`🛡️  Security: Helmet + CORS (${allowedOrigins.join(', ')}) + Throttler`);
}

bootstrap();
