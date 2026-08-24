import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    // REDIS_URL takes priority (Upstash TLS, Railway, Render managed Redis)
    // Falls back to host+port for local development
    this.client = redisUrl
      ? new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          lazyConnect: true,
          retryStrategy: () => null,
          tls: redisUrl.startsWith('rediss://') ? {} : undefined,
        })
      : new Redis({
          host,
          port,
          maxRetriesPerRequest: null,
          lazyConnect: true,
          retryStrategy: () => null,
        });

    this.client.on('error', (_err) => {
      // Suppress unhandled crash; PostgreSQL row-locking handles concurrency as fallback
    });

    this.client
      .connect()
      .then(() => {
        const target = redisUrl ? redisUrl.replace(/:\/\/.*@/, '://***@') : `${host}:${port}`;
        this.logger.log(`Connected to Redis at ${target}`);
      })
      .catch((err) => {
        this.logger.warn(`Redis offline (${err.message}). DB row-locking is the fallback concurrency guard.`);
      });
  }

  getClient(): Redis {
    return this.client;
  }

  async setKey(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      this.logger.warn(`Redis setKey error: ${err.message}`);
    }
  }

  async getKey(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      return null;
    }
  }

  async delKey(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Redis delKey error: ${err.message}`);
    }
  }

  async acquireLock(lockKey: string, ttlSeconds = 10): Promise<boolean> {
    try {
      const res = await this.client.set(lockKey, 'LOCKED', 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    } catch (err) {
      return true; // Fallback to DB lock if Redis down
    }
  }

  async releaseLock(lockKey: string): Promise<void> {
    try {
      await this.client.del(lockKey);
    } catch (err) {
      // Ignore
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
