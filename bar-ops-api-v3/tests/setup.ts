import 'reflect-metadata';
import { vi } from 'vitest';

// Swap the real ioredis for an in-memory implementation so the shared Redis
// proxy works without a network. Each test file gets a fresh module graph.
vi.mock('ioredis', async () => {
    const { default: RedisMock } = await import('ioredis-mock');
    return { default: RedisMock };
});
