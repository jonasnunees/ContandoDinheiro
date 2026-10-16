import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('atalho mobile aparece após uma tela e retorna o foco ao conteúdo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar.*(?:Demonstração|sem login)/i }).first().click();
  const button = page.locator('button[aria-label="Voltar ao topo"]');
  await expect(button).toBeHidden();
  await expect(button).toHaveAttribute('tabindex', '-1');
  await page.evaluate(() => window.scrollTo(0, 200));
  await expect(button).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, innerHeight + 20));
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('tabindex', '0');
  const topBounds = await button.boundingBox();
  const addBounds = await page.getByRole('button', { name: 'Nova Transação', exact: true }).last().boundingBox();
  expect(topBounds!.height).toBeGreaterThanOrEqual(44);
  expect(topBounds!.y + topBounds!.height).toBeLessThan(addBounds!.y);
  const accessibility = await new AxeBuilder({ page }).include('button[aria-label="Voltar ao topo"]').analyze();
  expect(accessibility.violations).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(async () => {
    const back = await button.boundingBox();
    const add = await page.getByRole('button', { name: 'Nova Transação', exact: true }).last().boundingBox();
    const footer = await page.locator('footer').boundingBox();
    return Math.abs(back!.y - add!.y) < 1 && back!.x + back!.width < add!.x
      && Math.abs(footer!.y - (add!.y + add!.height) - 16) < 1;
  }).toBe(true);
  await page.evaluate(() => window.scrollTo(0, innerHeight + 20));
  await expect.poll(async () => {
    const back = await button.boundingBox();
    const add = await page.getByRole('button', { name: 'Nova Transação', exact: true }).last().boundingBox();
    return back!.y + back!.height < add!.y && Math.abs(back!.x - add!.x) < 1;
  }).toBe(true);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(button).toBeHidden();
  await expect(page.locator('#dashboard-content')).toBeFocused();
});

test('retorno animado sobe gradualmente e permite interromper com toque', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar.*(?:Demonstração|sem login)/i }).first().click();
  await page.evaluate(() => window.scrollTo(0, 600));
  const button = page.getByRole('button', { name: 'Voltar ao topo', exact: true });
  await button.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(590);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 600));
  await button.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(590);
  const stoppedAt = await page.evaluate(() => {
    window.dispatchEvent(new Event('touchstart'));
    return scrollY;
  });
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => scrollY)).toBe(stoppedAt);
});
