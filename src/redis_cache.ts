import { createClient, RedisClientType } from 'redis';
import { Entity } from './interfaces/entity';

/** Init a redis client */
let redisClient: RedisClientType;
let _redisEnabled = false;

if (process.env.REDIS_PORT && process.env.REDIS_HOST) {
  console.log('[@quantos/micro-request][Init redis client] Creating client on ' + process.env.REDIS_URL);
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient
    .connect()
    .then(() => {
      _redisEnabled = true;
    })
    .catch((error: any) => {
      console.error('[@quantos/micro-request][Init redis client] ' + error);
      _redisEnabled = false;
    });
}

export class RedisCache {
  static async get<T>(id: any, cachePrefix?: string): Promise<T | null> {
    if (!_redisEnabled) {
      return null;
    }
    const data = await redisClient.get(`${cachePrefix}:${id}`);
    if (data && data.length) {
      const cached: T = JSON.parse(data);
      return cached;
    }
  }

  static async getMany<Y, T extends Entity<Y>>(ids: Y[], cachePrefix?: string): Promise<T[]> {
    if (!_redisEnabled) {
      return null;
    }
    const cacheds: T[] = [];
    for (const key of ids) {
      const cached = await this.get<T>(key);
      if (cached) {
        cacheds.push(cached);
      }
    }
    return cacheds;
  }

  static async set<Y, T extends Entity<Y>>(id: Y, data: T, cachePrefix?: string, options?: { ttl?: number }): Promise<void> {
    if (!_redisEnabled) {
      return;
    }
    try {
      await redisClient.set(`${cachePrefix}:${id}`, JSON.stringify(data), { EX: options?.ttl });
    } catch (e) {
      // do nothing
    }
  }
}