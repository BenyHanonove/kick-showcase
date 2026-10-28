import { describe, expect, it } from 'vitest';
import { redisClient, getTableVersion } from '@aws/redis/client.redis';

describe('test harness', () => {
    it('routes the shared Redis client to the in-memory mock', async () => {
        await redisClient.flushall();
        expect(await getTableVersion('T')).toBe('0');
        await redisClient.incr('version:T');
        expect(await getTableVersion('T')).toBe('1');
    });
});
