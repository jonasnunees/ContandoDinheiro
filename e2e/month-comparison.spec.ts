import { test, expect } from '@playwright/test';

test.use({ hasTouch: true });

for (const width of [390, 1280]) {
  test(`comparativo usa linhas sem seção textual em ${width}px`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-24T12:00:00-03:00'));
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/demo');
    if (width < 768) await page.getByRole('button', { name: 'Gráficos', exact: true }).click();
    const mode = page.getByLabel('O que comparar');
    await expect(page.getByRole('img', { name: /^Receitas e despesas por mês/ })).toBeVisible();
    const initialChart = page.getByRole('img', { name: /^Receitas e despesas por mês/ });
    await initialChart.scrollIntoViewIfNeeded();
    const box = (await initialChart.boundingBox())!;
    if (width === 390) await page.touchscreen.tap(box.x + 100, box.y + 100);
    else await page.mouse.move(box.x + 100, box.y + 100);
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip.getByText('Receitas recebidas', { exact: true })).toBeVisible();
    await expect(tooltip.getByText('Despesas pagas', { exact: true })).toBeVisible();
    const bounds = (await tooltip.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await tooltip.screenshot({ path: `test-results/tooltip-${width}.png` });
    await page.getByRole('button', { name: 'Fechar detalhes do gráfico' }).click();
    await expect(tooltip).toHaveCount(0);
    const legend = page.getByRole('group', { name: 'Séries e valores do gráfico' });
    await expect(legend.getByRole('button')).toHaveCount(2);
    await expect(legend.getByText(/R\$/).first()).toBeVisible();
    await page.getByLabel('Mês dos valores da legenda').selectOption({ index: 0 });

    await expect(
      page.getByRole('region', { name: 'Comparação entre meses', exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText('Consultar valores desta comparação')).toHaveCount(0);
    await expect(page.getByText('Consultar valores dos gráficos em tabela')).toHaveCount(0);
    await mode.selectOption('category');
    await page.getByLabel('Categoria', { exact: true }).selectOption('Moradia');
    await expect(page.getByRole('img', { name: /^Despesas com Moradia/ })).toBeVisible();
    await mode.selectOption('all');
    await expect(page.getByRole('img', { name: /^Todas as categorias de despesas/ })).toBeVisible();
    await page.getByLabel('Mês dos lançamentos').selectOption('-1');
    await expect(page.getByLabel('Primeiro mês')).toHaveCount(0);
    await expect(page.getByLabel('Segundo mês')).toHaveCount(0);
    await expect(page.getByRole('img', { name: /^Todas as categorias de despesas/ })).toBeVisible();
    await page.getByLabel('Período do comparativo').selectOption('quarter');
    await expect(page.getByLabel('Intervalo do comparativo')).toHaveValue('3');
    await expect(page.getByLabel('Intervalo do comparativo').locator('option')).toHaveCount(4);
    await expect(page.getByLabel('Primeiro período')).toHaveCount(0);
    await page.getByLabel('Período do comparativo').selectOption('semester');
    await expect(page.getByLabel('Intervalo do comparativo')).toHaveValue('1');
    await expect(page.getByLabel('Intervalo do comparativo').locator('option')).toHaveCount(2);
    await page
      .getByRole('img', { name: /^Todas as categorias de despesas/ })
      .scrollIntoViewIfNeeded();
    const panel = page
      .getByRole('heading', { name: 'Comparação visual por período' })
      .locator('xpath=ancestor::div[contains(@class, "lg:col-span-2")]');
    await expect(page.getByLabel('Mês dos valores da legenda').locator('option')).toHaveCount(6);
    await expect(legend.getByRole('button')).toHaveCount(6);
    const series = legend.getByRole('button').first();
    await series.click();
    await expect(series).toHaveAttribute('aria-pressed', 'false');
    await series.click();
    await expect(series).toHaveAttribute('aria-pressed', 'true');
    await panel.screenshot({ path: `test-results/comparativo-linhas-${width}.png` });
    await mode.selectOption('payment');
    await page.getByLabel('Forma de pagamento da comparação').selectOption('Boleto');
    await expect(page.getByRole('img', { name: /^Despesas por Boleto/ })).toBeVisible();
    await mode.selectOption('payments');
    await expect(page.getByRole('img', { name: /^Todas as formas de pagamento/ })).toBeVisible();
    await mode.selectOption('totals');
    await expect(page.getByRole('img', { name: /^Receitas e despesas por mês/ })).toBeVisible();
    await page.getByLabel('Mês dos lançamentos').selectOption('9');
    await page.getByLabel('Período do comparativo').selectOption('selected');
    await expect(page.getByLabel('Mês dos lançamentos')).toHaveValue('9');
    await expect(page.getByLabel('Intervalo do comparativo')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}
