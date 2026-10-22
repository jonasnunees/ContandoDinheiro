import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('notas públicas em modo claro com navegação e preferência de tema preservada', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('gf_app_theme', 'dark'));
  await page.goto('/');
  await page.getByRole('link', { name: 'Notas da versão', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Notas da versão', exact: true })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Versão 1.0', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Versão 1.0.1', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Versão 1.1.0', exact: true })).toBeVisible();
  await expect(page.locator('article').first()).toHaveAccessibleName('Versão 1.2.1');
  await expect(page.getByRole('article', { name: 'Versão 1.1.1', exact: true }).getByRole('link', { name: '/demo', exact: true })).toHaveAttribute('href', 'https://contando-dinheiro.vercel.app/demo');
  await expect(page.locator('article').first().locator('time')).toHaveAttribute('datetime', '2026-10-22');
  await expect(page.getByRole('article', { name: 'Versão 1.2.0', exact: true }).getByRole('heading', { name: 'Separe vencimento e pagamento efetivo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Versão 1.1.2', exact: true })).toBeVisible();
  await expect(page.locator('main').locator('..')).toHaveCSS('color-scheme', 'light');
  await expect(page.locator('main').locator('..')).toHaveCSS('background-color', 'oklch(0.984 0.003 247.858)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Versão 1.0', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar ao aplicativo' }).click();
  await expect(page.getByRole('link', { name: 'Notas da versão', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gf_app_theme'))).toBe('dark');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Versão 1.0', exact: true })).toBeVisible();
});
