import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const r = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// Mirrors compilerOptions.paths in tsconfig.json. More specific prefixes first:
// Vite applies the first alias whose `find` matches.
export default defineConfig({
    resolve: {
        alias: [
            { find: /^@aws\/s3\//, replacement: r('./packages/shared/aws/s3/') },
            { find: /^@aws\/dynamo\//, replacement: r('./packages/shared/aws/dynamo/') },
            { find: /^@aws\/eventbridge\//, replacement: r('./packages/shared/aws/eventbridge/') },
            { find: /^@aws\/lambdas\//, replacement: r('./packages/shared/aws/lambdas/') },
            { find: /^@aws\/redis\//, replacement: r('./packages/shared/aws/redis/') },
            { find: /^@dtos\//, replacement: r('./packages/shared/dtos/') },
            { find: /^@env\//, replacement: r('./packages/shared/env/') },
            { find: /^@guards\//, replacement: r('./packages/shared/guards/') },
            { find: /^@validation\//, replacement: r('./packages/shared/validation/') },
            { find: /^@utils\//, replacement: r('./packages/shared/utils/') },
            { find: /^@infrastructure\//, replacement: r('./infrastructure/') },
            { find: /^@functions\//, replacement: r('./packages/functions/') },
        ],
    },
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        setupFiles: ['./tests/setup.ts'],
        // Unit tests never talk to AWS: every SDK client is mocked per test
        env: {
            AWS_REGION: 'eu-west-1',
            AWS_ACCESS_KEY_ID: 'test',
            AWS_SECRET_ACCESS_KEY: 'test',
            REDIS_HOST: 'localhost',
            POWERTOOLS_DEV: 'true',
            POWERTOOLS_TRACE_ENABLED: 'false',
            POWERTOOLS_LOG_LEVEL: 'SILENT',
        },
        restoreMocks: true,
    },
});
