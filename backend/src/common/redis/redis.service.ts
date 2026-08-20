import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.client = new Redis({
      host,
      port,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    this.client.connect().then(() => {
      this.logger.log(`Connected to Redis at ${host}:${port}`);
    }).catch(err => {
      this.logger.warn(`Redis connection delayed: ${err.message}. Operating with fallback mode.`);
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
