import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1280]) {
    test(`busca, limpeza e teclado: ${theme}, ${width}px`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-10-24T12:00:00-03:00'));
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem('gf_app_theme', value), theme);
      await page.goto('/demo');
      const search = page.getByRole('textbox', { name: 'Buscar transações' });
      await expect(search).toBeVisible();
      await expect(page.getByRole('group', { name: 'Escopo do resumo' })).toHaveCount(0);
      const scope = page.getByRole('group', { name: 'Escopo do resumo' });
      const dueDates = page.getByRole('region', { name: 'Pendências e próximos vencimentos' });
      const originalDueDates = await dueDates.innerText();
      await search.fill('   ');
      await expect(scope).toHaveCount(0);
      await page.getByLabel('Filtrar por tipo').selectOption('despesa');
      await expect(scope).toContainText('Resumo filtrado: Despesas');
      await page.getByLabel('Filtrar por tipo').selectOption('todos');
      await page.getByLabel('Filtrar por situação').selectOption('pendente');
      await expect(scope).toContainText('Resumo filtrado: Pendentes');
      await page.getByLabel('Filtrar por situação').selectOption('pago');
      await expect(scope).toContainText('Resumo filtrado: Pagos / Recebidos');
      await page.getByLabel('Filtrar por situação').selectOption('todos');
      await search.fill('  Salário Mensal  ');
      await expect(scope).toContainText('Resumo filtrado: Busca: Salário Mensal');
      await expect(
        page.getByRole('button', { name: 'Editar Salário Mensal', exact: true }).first(),
      ).toBeVisible();
      await expect(page.getByText('R$ 6.500,00', { exact: true }).first()).toBeVisible();
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Exportar transações para CSV' }).click();
      const stream = await (await downloadEvent).createReadStream();
      let csv = '';
      for await (const chunk of stream!) csv += chunk.toString();
      expect(csv).toContain('Salário Mensal');
      expect(csv).not.toContain('Aluguel do Apartamento');
      await page.getByLabel('Filtrar por tipo').selectOption('receita');
      await page.getByLabel('Filtrar por situação').selectOption('pendente');
      await expect(scope).toContainText(
        'Resumo filtrado: Receitas · Pendentes · Busca: Salário Mensal',
      );
      expect(await dueDates.innerText()).toBe(originalDueDates);
      await expect(page.getByText('Nenhuma transação encontrada', { exact: true })).toBeVisible();
      const audit = await new AxeBuilder({ page })
        .include('div:has(> div > input[aria-label="Buscar transações"])')
        .include('#financial-summary')
        .analyze();
      expect(audit.violations.map((v) => v.id)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const clear = page.getByRole('button', { name: 'Limpar filtros', exact: true });
      await clear.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('region', { name: 'Resumo financeiro' })).toBeFocused();
      await expect(scope).toHaveCount(0);
      expect(await dueDates.innerText()).toBe(originalDueDates);
      await expect(search).toHaveValue('');
      await expect(page.getByLabel('Filtrar por tipo')).toHaveValue('todos');
      await expect(page.getByLabel('Filtrar por situação')).toHaveValue('todos');
      await expect(page.getByLabel('Mês dos lançamentos')).toHaveValue('9');
      await expect(page.getByLabel('Ano dos lançamentos')).toHaveValue('2026');
      await page.getByLabel('Mês dos lançamentos').selectOption('-1');
      await search.fill('<img src=x onerror=alert(1)>');
      await expect(scope).toContainText('Busca: <img src=x onerror=alert(1)>');
      await expect(scope.locator('img')).toHaveCount(0);
      const liveNotice = page.getByRole('status').filter({ hasText: 'Busca ativa' });
      const announcement = await liveNotice.innerText();
      await search.fill('internet'.repeat(50));
      await expect(liveNotice).toHaveText(announcement);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await clear.click();
      await expect(page.getByLabel('Mês dos lançamentos')).toHaveValue('-1');
      await expect(page.getByLabel('Ano dos lançamentos')).toHaveValue('2026');
      expect(await dueDates.innerText()).toBe(originalDueDates);
    });
  }
}

test('falha de leitura remove totais e permite recuperar', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByRole('textbox', { name: 'Buscar transações' })).toBeVisible();
  const saved = await page.evaluate(() => localStorage.getItem('gf_local_transactions')!);
  await page.evaluate(() => localStorage.setItem('gf_local_transactions', '{invalid'));
  await page.getByRole('button', { name: 'Recarregar lançamentos' }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.getByText('Saldo do Período', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Buscar transações' })).toHaveCount(0);
  await page.evaluate((value) => localStorage.setItem('gf_local_transactions', value), saved);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('textbox', { name: 'Buscar transações' })).toBeVisible();
  await expect(page.getByText('Saldo do Período', { exact: true })).toBeVisible();
});
