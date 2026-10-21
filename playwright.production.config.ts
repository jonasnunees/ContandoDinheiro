import { defineConfig } from '@playwright/test';

// Usa os arquivos compilados e o service worker real para verificar o cache offline.
export default defineConfig({
  testDir: './e2e/production',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    timezoneId: 'America/Sao_Paulo',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
