import { test, expect } from '@playwright/test';
test('conversor compilado não guarda cotações na PWA e informa falha offline', async ({
  page,
  context,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-26T15:00Z'));
  let history = 0;
  let quotes = 0;
  await context.route('https://economia.awesomeapi.com.br/**', (route) => {
    if (route.request().url().includes('/daily/')) {
      history++;
      return route.fulfill({
        json: [
          { bid: '5', timestamp: '1792526400' },
          { bid: '4', timestamp: '1792440000' },
        ],
      });
    }
    quotes++;
    return route.fulfill({
      json: {
        USDBRL: { code: 'USD', codein: 'BRL', bid: '5', timestamp: '1792950000' },
        EURBRL: { code: 'EUR', codein: 'BRL', bid: '6', timestamp: '1792950010' },
      },
    });
  });
  const financial: string[] = [];
  page.on('request', (r) => {
    if (/AccountWorkspace|rest\/v1/.test(r.url())) financial.push(r.url());
  });
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  expect(
    await page.evaluate(async () => {
      const urls = (
        await Promise.all(
          (await caches.keys()).map(async (key) =>
            (await (await caches.open(key)).keys()).map((r) => r.url),
          ),
        )
      ).flat();
      return urls.filter((url) =>
        /\/(?:chart|CurrencyChart|CurrencyPage|FinancialCharts|AccountWorkspace)-/.test(url),
      );
    }),
  ).toEqual([]);
  await page.goto('/ferramentas/conversor-de-moedas');
  await expect(page.getByRole('status')).toContainText('5,00');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect(page.getByRole('status')).toContainText('5,00');
  expect(quotes).toBeGreaterThan(0);
  expect(history).toBeGreaterThan(0);
  await expect(page.getByRole('img')).toBeVisible();
  expect(
    await page.evaluate(async () => {
      const urls = await Promise.all(
        (await caches.keys()).map(async (key) =>
          (await (await caches.open(key)).keys()).map((r) => r.url),
        ),
      );
      return urls.flat().filter((url) => url.includes('awesomeapi'));
    }),
  ).toEqual([]);
  await context.unroute('https://economia.awesomeapi.com.br/**');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('alert').first()).toContainText('conexão');
  await expect(page.getByRole('status')).not.toContainText('5,00');
  expect(financial).toEqual([]);
});
