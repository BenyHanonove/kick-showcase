// Demo-only Playwright config: runs the real SPA against the in-browser mock
// backend in demo/mock-api.ts. Not part of CI; used to record docs/demo.*
import { defineConfig, devices } from '@playwright/test'

const PORT = 5179

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.pw\.ts$/,
  outputDir: './.output',
  timeout: 5 * 60_000,
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    colorScheme: 'light',
  },
  projects: [
    { name: 'record', testMatch: /record\.pw\.ts$/ },
    { name: 'screenshots', testMatch: /screenshots\.pw\.ts$/ },
    { name: 'explore', testMatch: /explore\.pw\.ts$/ },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: true,
    env: { VITE_WS_URL: 'wss://ws.demo.invalid', VITE_APP_ENV: 'development' },
  },
})
