import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('documentos públicos abrem diretamente, sem autenticação e com índice funcional', async ({ page }) => {
  let backendRequests = 0;
  page.on('request', request => { if (/supabase\.co/.test(request.url())) backendRequests++; });
  for (const [path, title] of [['/termos-de-uso', 'Termos de Uso'], ['/politica-de-privacidade', 'Política de Privacidade']]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page).toHaveTitle(`${title} — ContandoDinheiro`);
    await page.getByRole('navigation', { name: 'Nesta página' }).getByRole('link').first().click();
    await expect(page.locator('section').first()).toBeInViewport();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'jonas.nunees@gmail.com', exact: true })).toHaveAttribute('href', 'mailto:jonas.nunees@gmail.com');
  }
  expect(backendRequests).toBe(0);
});

test('documentos estão acessíveis na apresentação, no login e na demonstração', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Documentos legais' }).getByRole('link', { name: 'Termos de Uso', exact: true })).toHaveAttribute('href', '/termos-de-uso');
  await page.getByRole('button', { name: 'Começar gratuitamente', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Política de Privacidade', exact: true })).toBeVisible();
  await page.goto('/demo');
  await expect(page.getByRole('navigation', { name: 'Documentos legais' }).getByRole('link', { name: 'Política de Privacidade', exact: true })).toHaveAttribute('href', '/politica-de-privacidade');
});

test('política permanece legível no celular e acessível nos dois temas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/politica-de-privacidade');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => {
      document.documentElement.classList.toggle('dark', value === 'dark');
      document.documentElement.classList.toggle('light', value === 'light');
    }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.screenshot({ path: 'test-results/legal-mobile.png', fullPage: false });
});
