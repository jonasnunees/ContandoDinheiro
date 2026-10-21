import { test, expect } from '@playwright/test';

test('demo compilada preserva dados ao recarregar offline sem consultar o banco', async ({ page, context }) => {
  const errors: string[] = [];
  const databaseRequests: string[] = [];
  const initialPanelRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (request.url().includes('/rest/v1/')) databaseRequests.push(request.url());
    if (request.url().includes('/assets/AccountWorkspace-')) initialPanelRequests.push(request.url());
  });
  await page.goto('/');
  const demoLink = page.getByRole('link', { name: /Explorar demonstração sem login/ });
  await expect(demoLink).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gf_local_transactions'))).toBeNull();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect(demoLink).toBeVisible();
  expect(initialPanelRequests).toEqual([]);
  await demoLink.click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toBeVisible();
  await expect(page).toHaveTitle('Demonstração — ContandoDinheiro');
  await page.getByRole('button', { name: 'Editar Salário Mensal', exact: true }).first().click();
  await page.getByLabel('Descrição', { exact: true }).fill('Salário preservado offline');
  await page.getByRole('button', { name: 'Atualizar Transação', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const saved = await page.evaluate(() => localStorage.getItem('gf_local_transactions'));
  await expect.poll(() => page.evaluate(async () => {
    const panel = await caches.open('optional-screens');
    const styles = await caches.open('app-styles');
    return (await panel.keys()).some(request => request.url.includes('/assets/AccountWorkspace-'))
      && (await styles.keys()).some(request => request.url.endsWith('.css'));
  })).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Salário preservado offline', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gf_local_transactions'))).toBe(saved);
  expect(databaseRequests).toEqual([]);
  expect(errors).toEqual([]);
});
