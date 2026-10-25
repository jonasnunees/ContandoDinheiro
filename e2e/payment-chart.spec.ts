import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1280]) {
    test(`formas isoladas em ${theme}, ${width}px`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-10-24T12:00:00-03:00'));
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem('gf_app_theme', value), theme);
      await page.goto('/demo');
      await expect(page.getByLabel('Mês dos lançamentos')).toBeAttached();
      await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('gf_local_transactions')!);
        state.series = [];
        state.transactions = [0.1, 0.2, 0.41, 0.53, 0.67, 99].map((valor, i) => ({
          id: `payment-${i}`,
          user_id: 'demo-user-id',
          descricao: 'Recorte teste',
          valor,
          tipo: i === 3 || i === 4 ? 'receita' : 'despesa',
          status: i === 2 || i === 4 ? 'pendente' : 'pago',
          data: i === 5 ? '2026-09-05' : '2026-10-05',
          data_pagamento: i === 2 || i === 4 ? null : '2026-09-30',
          categoria: 'Outros',
          forma_pagamento: 'Pix',
        }));
        localStorage.setItem('gf_local_transactions', JSON.stringify(state));
      });
      await page.reload();
      if (width < 768) await page.getByRole('button', { name: 'Gráficos', exact: true }).click();
      const select = page.getByLabel('Visualização por forma de pagamento');
      await expect(select).toHaveValue('paidExpenses');
      const card = select.locator('xpath=../..');
      await card.getByText('Ver dados por forma em tabela').click();
      const comparison = page.getByRole('table', {
        name: 'Receitas e despesas por mês',
        exact: true,
      });
      const before = await comparison.textContent();
      const stored = await page.evaluate(() => localStorage.getItem('gf_local_transactions'));
      const requests: string[] = [];
      page.on('request', (r) => {
        if (r.url().includes('/rest/v1/')) requests.push(r.url());
      });
      for (const [value, label, amount] of [
        ['paidExpenses', 'Despesas pagas', '0,30'],
        ['pendingExpenses', 'Despesas pendentes', '0,41'],
        ['receivedIncome', 'Receitas recebidas', '0,53'],
        ['pendingIncome', 'Receitas pendentes', '0,67'],
      ]) {
        await select.selectOption(value);
        await expect(card.getByRole('heading')).toContainText(label);
        await expect(card.getByRole('img')).toHaveAttribute('aria-label', new RegExp(amount));
        const table = card.getByRole('table');
        await expect(table.getByRole('row', { name: /Pix/ })).toContainText(amount);
        await expect(table.locator('tfoot')).toContainText(amount);
        expect(await comparison.textContent()).toBe(before);
      }
      await select.focus();
      await page.keyboard.press('Home');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(select).toHaveValue('pendingExpenses');
      await expect(select).toBeFocused();
      await expect(card.getByText(/Forma prevista de pagamento/).first()).toBeVisible();
      const axe = await new AxeBuilder({ page }).include('main').analyze();
      expect(axe.violations.map((v) => v.id)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(await page.evaluate(() => localStorage.getItem('gf_local_transactions'))).toBe(stored);
      expect(requests).toEqual([]);
      await page.screenshot({ path: `test-results/payment-${theme}-${width}.png`, fullPage: true });
      if (width < 768) await page.getByRole('button', { name: 'Transações', exact: true }).click();
      await page.getByLabel('Filtrar por tipo').selectOption('receita');
      if (width < 768) await page.getByRole('button', { name: 'Gráficos', exact: true }).click();
      await expect(card.getByText(/Nenhum lançamento/)).toBeVisible();
      await expect(card.getByRole('img')).toHaveCount(0);
      await expect(card.getByRole('table').locator('tfoot')).toContainText('0,00');
      if (width < 768) await page.getByRole('button', { name: 'Transações', exact: true }).click();
      await page.getByLabel('Filtrar por tipo').selectOption('todos');
      await page.getByLabel('Filtrar por situação').selectOption('pago');
      if (width < 768) await page.getByRole('button', { name: 'Gráficos', exact: true }).click();
      await expect(card.getByText(/Nenhum lançamento/)).toBeVisible();
      await select.selectOption('paidExpenses');
      await expect(card.getByRole('img')).toHaveAttribute('aria-label', /0,30/);
      if (width < 768) await page.getByRole('button', { name: 'Transações', exact: true }).click();
      await page.getByLabel('Buscar transações').fill('ausente');
      if (width < 768) await page.getByRole('button', { name: 'Gráficos', exact: true }).click();
      await expect(card.getByText(/Nenhum lançamento/)).toBeVisible();
      if (width < 768) await page.getByRole('button', { name: 'Transações', exact: true }).click();
      await page.getByLabel('Buscar transações').fill(' Pix ');
      if (width < 768) await page.getByRole('button', { name: 'Gráficos', exact: true }).click();
      await expect(card.getByRole('img')).toHaveAttribute('aria-label', /0,30/);
      await page.getByLabel('Mês dos lançamentos').selectOption('8');
      await expect(card.getByRole('img')).toHaveAttribute('aria-label', /99,00/);
      await page.getByLabel('Mês dos lançamentos').selectOption('10');
      await expect(card.getByText(/Nenhum lançamento/)).toBeVisible();
    });
  }
}
