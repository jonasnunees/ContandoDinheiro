import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('recursos: navegação circular, dots e acessibilidade no celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Recursos do ContandoDinheiro' });
  await carousel.scrollIntoViewIfNeeded();
  await expect(carousel.getByRole('group', { name: '1 de 6', exact: true })).toBeVisible();
  await carousel.getByRole('button', { name: 'Recurso anterior', exact: true }).click();
  await expect(carousel.getByRole('button', { name: 'Ir para recurso 6 de 6' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await page.waitForTimeout(100);
  await carousel.getByRole('button', { name: 'Próximo recurso' }).click();
  await expect(carousel.getByRole('button', { name: 'Ir para recurso 1 de 6' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await page.waitForTimeout(100);
  await carousel.getByRole('button', { name: 'Ir para recurso 4 de 6' }).click();
  await expect(carousel.getByRole('group', { name: '4 de 6', exact: true })).toBeVisible();
  await expect(carousel.getByRole('button', { name: /rotação/ })).toHaveCount(0);
  expect(
    (await new AxeBuilder({ page }).include('[aria-roledescription="carrossel"]').analyze())
      .violations,
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('recursos: avanço automático, pausa no hover e no foco', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Recursos do ContandoDinheiro' });
  await page.mouse.move(0, 0);
  await page.clock.runFor(6500);
  await expect(carousel.getByRole('button', { name: 'Ir para recurso 2 de 6' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await carousel.hover();
  await page.clock.runFor(7000);
  await expect(carousel.getByRole('button', { name: 'Ir para recurso 2 de 6' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(carousel.getByRole('button', { name: /rotação/ })).toHaveCount(0);
  await page.mouse.move(0, 0);
  await page.clock.runFor(6500);
  await expect(carousel.getByRole('button', { name: 'Ir para recurso 3 de 6' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await carousel.getByRole('button', { name: 'Próximo recurso' }).focus();
  await page.clock.runFor(7000);
  await expect(carousel.getByRole('button', { name: 'Ir para recurso 3 de 6' })).toHaveAttribute(
    'aria-current',
    'true',
  );
});
