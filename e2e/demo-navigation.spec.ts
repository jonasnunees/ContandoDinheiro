import { test, expect } from '@playwright/test';

test('demonstração tem endereço próprio e permite voltar à apresentação', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toHaveCount(0);
  await page
    .getByRole('link', { name: /Explorar.*(?:Demonstração|sem login)/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toBeVisible();
  await page.getByRole('link', { name: 'Ver Apresentação', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toBeVisible();
});
