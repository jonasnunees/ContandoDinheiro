import { defineConfig } from '@playwright/test';

// Configura os testes de navegador e inicia o site localmente para executá-los.
export default defineConfig({
  testDir: './e2e',
  testIgnore: '**/production/**',
  // Execução serial evita disputas nos cenários que interceptam serviços e simulam sessão.
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:3000', browserName: 'chromium', headless: true, timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI },
});
