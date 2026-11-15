import { defineConfig } from '@playwright/test';
const port = process.env.PAPER_PORT || '4173';
const liveUrl = process.env.PLAYWRIGHT_BASE_URL;
const localUrl = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: liveUrl || localUrl,
    headless: true,
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: liveUrl
    ? undefined
    : {
        command: `npm run dev -- --port ${port} --strictPort`,
        url: localUrl,
        reuseExistingServer: false,
      },
  reporter: [['list'], ['html', { open: 'never' }]],
});
