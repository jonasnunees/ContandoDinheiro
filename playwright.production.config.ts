import { defineConfig } from '@playwright/test';

// Usa os arquivos compilados e o service worker real para verificar o cache offline.
export default defineConfig({
  testDir: './e2e/production',
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report/production', open: 'never' }]]
    : 'list',
  outputDir: 'test-results/production',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
