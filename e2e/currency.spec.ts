import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const path = '/ferramentas/conversor-de-moedas';
const api = '**/economia.awesomeapi.com.br/json/last/**';
const quotes = {
  USDBRL: { code: 'USD', codein: 'BRL', bid: '5', timestamp: '1792950000' },
  EURBRL: { code: 'EUR', codein: 'BRL', bid: '6', timestamp: '1792950010' },
};
test('acesso isolado, recarga, conversões e cache sem painel', async ({ page }) => {
  let calls = 0;
  const financial: string[] = [];
  page.on('request', (request) => {
    if (/AccountWorkspace|rest\/v1|FinancialCharts/.test(request.url()))
      financial.push(request.url());
  });
  await page.route(api, async (route) => {
    calls++;
    await route.fulfill({ json: quotes });
  });
  await page.goto(path);
  await expect(page).toHaveTitle('Conversor de moedas — ContandoDinheiro');
  await expect(page.getByRole('status')).toContainText('5,00');
  await page.getByLabel('Valor', { exact: true }).fill('1.234,56');
  await expect(page.getByRole('status')).toContainText('6.172,80');
  await page.getByRole('button', { name: 'Inverter moedas' }).click();
  await expect(page.getByLabel('Valor', { exact: true })).toHaveValue('1.234,56');
  await expect(page.getByRole('status')).toContainText('246,91');
  await page.getByRole('button', { name: 'Atualizar cotação' }).click();
  expect(calls).toBe(1);
  await page.getByLabel('Para', { exact: true }).selectOption('BRL');
  await expect(page.getByRole('status')).toContainText('Mesma moeda');
  expect(calls).toBe(1);
  await page.getByLabel('Valor', { exact: true }).fill('-1');
  await expect(page.getByText('Informe um valor válido', { exact: false })).toBeVisible();
  await expect(page.getByRole('status')).not.toContainText('NaN');
  expect(financial).toEqual([]);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => /demo|transaction/i.test(key)),
    ),
  ).toEqual([]);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Conversor de moedas' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('5,00');
  expect(financial).toEqual([]);
});
test('carregamento, erro e nova tentativa', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(api, async (route) => {
    await gate;
    await route.fulfill({ status: 429, json: {} });
  });
  await page.goto(path);
  await expect(page.getByRole('status')).toContainText('Consultando');
  await expect(page.getByRole('button', { name: 'Atualizar cotação' })).toBeDisabled();
  release();
  await expect(page.getByRole('alert')).toContainText('Limite');
  await page.route(api, (route) => route.fulfill({ json: quotes }));
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('status')).toContainText('5,00');
});
for (const width of [320, 1280])
  for (const theme of ['light', 'dark']) {
    test(`tema ${theme} e largura ${width}, axe e teclado`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((theme) => localStorage.setItem('gf_app_theme', theme), theme);
      await page.route(api, (route) => route.fulfill({ json: quotes }));
      await page.goto(path);
      await expect(page.getByRole('status')).toContainText('5,00');
      const button = page.getByRole('button', { name: 'Ferramentas' });
      await button.focus();
      await page.keyboard.press('Enter');
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Conversor de moedas' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(button).toBeFocused();
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      await button.click();
      await page.getByRole('heading').click();
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: `test-results/currency-${theme}-${width}.png`,
        fullPage: true,
      });
    });
  }
for (const location of ['/', '/demo'])
  for (const width of [320, 1280]) {
    test(`menu em ${location} largura ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route(api, (route) => route.fulfill({ json: quotes }));
      await page.goto(location);
      if (width === 320)
        await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
      await page.getByRole('button', { name: 'Ferramentas', exact: true }).click();
      await page.getByRole('link', { name: 'Conversor de moedas', exact: true }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { name: 'Conversor de moedas' })).toBeVisible();
    });
  }
test('atualização identifica cotação anterior e mantém data em caso de falha', async ({ page }) => {
  await page.clock.install();
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(api, async (route) => {
    calls++;
    if (calls === 1) await route.fulfill({ json: quotes });
    else {
      await gate;
      await route.fulfill({ status: 503, json: {} });
    }
  });
  await page.goto(path);
  await expect(page.getByRole('status')).toContainText('5,00');
  await page.clock.fastForward(60001);
  await page.getByRole('button', { name: 'Atualizar cotação' }).click();
  await expect(page.getByRole('status')).toContainText('Cotação anterior');
  await expect(page.getByRole('status')).toContainText('25/10/2026');
  release();
  await expect(page.getByRole('alert')).toContainText('indisponível');
  await expect(page.getByRole('status')).toContainText('Cotação anterior');
  expect(calls).toBe(2);
});
