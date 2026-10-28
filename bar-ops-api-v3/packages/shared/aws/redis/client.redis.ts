// Import external framework dependencies and status codes from third party packages
import Redis from "ioredis";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

// Import shared AWS services, guard security middleware, and utility helpers
import { AWS_CONFIG } from '@env/config.env';
import { logger } from '@utils/logger/logger.util';

const rawHost = AWS_CONFIG.redis.host;
// REDIS_HOST must be bare hostname, not the Upstash REST URL
if (rawHost?.includes("://")) {
  throw new Error(
    `CRITICAL: REDIS_HOST must be a bare hostname, got "${rawHost}". Strip the protocol scheme.`
  );
}
const host = rawHost;
const port = Number(AWS_CONFIG.redis.port) || 6379;

// Resolve Redis password: SSM in cloud, env locally
const resolvePassword = async (): Promise<string | undefined> => {
  if (AWS_CONFIG.redis.password) return AWS_CONFIG.redis.password;

  const paramName = AWS_CONFIG.redis.passwordParam;
  if (!paramName) return undefined;

  const ssm = new SSMClient({});
  const result = await ssm.send(new GetParameterCommand({ Name: paramName, WithDecryption: true }));
  return result.Parameter?.Value;
};

// Cached connection promise; built once per cold start
let redisPromise: Promise<Redis> | null = null;

export const getRedisClient = (): Promise<Redis> => {
  if (!redisPromise) {
    if (!host) {
      throw new Error("CRITICAL: REDIS_HOST env variable is missing inside getRedisClient!");
    }

    redisPromise = resolvePassword().then((password) => new Redis({
      host,
      port,
      password: password || undefined,
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
      tls: host.includes("upstash.io") ? {} : undefined,
      retryStrategy(times) {
        if (times > 3) {
          logger.error("Redis connection failed. Max retries exceeded.");
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    })).then((client) => {
      client.on("error", (err) => {
        logger.error("Redis Client Error:", err);
      });
      return client;
    });
  }
  return redisPromise;
};

// Async dispatch proxy: resolves the client before each method call
export const redisClient = new Proxy({} as Redis, {
  get(_target, prop) {
    return (...args: unknown[]) =>
      getRedisClient().then((client) => {
        const method = Reflect.get(client, prop) as (...callArgs: unknown[]) => unknown;
        return method.apply(client, args);
      });
  }
});

export const CACHE_TTL_SECONDS = 4 * 60 * 60; // 4 hours

// Cache version folded into keys; writes orphan old cached reads
export const getTableVersion = async (tableName: string): Promise<string> => {
  try {
    return (await redisClient.get(`version:${tableName}`)) || "0";
  } catch {
    return "0";
  }
};
