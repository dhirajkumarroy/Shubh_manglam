import { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';
import logger from './logger';

export const redisConfig: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

// Reusable connection for general operations (health checks, caching)
export const redisConnection = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
  logger.info('Redis: Connected successfully.');
});

redisConnection.on('error', (error) => {
  logger.error('Redis: Connection error occurred:', error);
});

export default redisConnection;
