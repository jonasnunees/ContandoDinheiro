import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [390, 1280]) {
  test(`estados vazios e recuperação por teclado em ${width}px`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-24T12:00:00-03:00'));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/demo');
    const search = page.getByRole('textbox', { name: 'Buscar transações' });
    await expect(search).toBeVisible();
    // Mantém somente um lançamento sintético em outubro; outros meses estarão vazios.
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('gf_local_transactions')!);
      localStorage.setItem(
        'gf_local_transactions',
        JSON.stringify({
          ...state,
          series: [],
          transactions: [
            {
              ...state.transactions[0],
              descricao: 'Exemplo de lançamento',
              data: '2026-10-10',
              tipo: 'receita',
              status: 'pago',
            },
          ],
        }),
      );
    });
    await page.getByRole('button', { name: 'Recarregar lançamentos' }).click();
    await search.fill('sem correspondência');
    const noMatch = page.getByRole('heading', {
      name: 'Nenhum lançamento corresponde aos filtros',
    });
    await expect(noMatch).toBeVisible();
    const empty = noMatch.locator('..');
    await expect(
      empty.getByRole('button', { name: 'Cadastrar transação', exact: true }),
    ).toHaveCount(0);
    await page.getByLabel('Filtrar por tipo').selectOption('despesa');
    await page.getByLabel('Filtrar por situação').selectOption('pendente');
    await search.fill('');
    await expect(noMatch).toBeVisible();
    await search.fill('sem correspondência');
    const clear = empty.getByRole('button', { name: 'Limpar filtros', exact: true });
    await clear.focus();
    await page.keyboard.press('Enter');
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('');
    await expect(page.getByLabel('Filtrar por tipo')).toHaveValue('todos');
    await expect(page.getByLabel('Filtrar por situação')).toHaveValue('todos');
    await expect(page.getByLabel('Mês dos lançamentos')).toHaveValue('9');
    await expect(page.getByLabel('Ano dos lançamentos')).toHaveValue('2026');
    await expect(
      page.getByRole('button', { name: 'Editar Exemplo de lançamento', exact: true }).first(),
    ).toBeVisible();

    await page.getByLabel('Mês dos lançamentos').selectOption('8');
    const noPeriod = page.getByRole('heading', { name: 'Nenhum lançamento neste período' });
    await expect(noPeriod).toBeVisible();
    await search.fill('sem correspondência');
    await page.getByLabel('Filtrar por tipo').selectOption('despesa');
    await expect(noPeriod).toBeVisible();
    // Força a carga anual do comparativo: outubro não pode tornar setembro não vazio.
    if (width < 768) await page.getByRole('button', { name: 'Gráficos', exact: true }).click();
    await page.getByLabel('Período do comparativo').selectOption('quarter');
    if (width < 768) await page.getByRole('button', { name: 'Transações', exact: true }).click();
    await expect(noPeriod).toBeVisible();
    const create = noPeriod
      .locator('..')
      .getByRole('button', { name: 'Cadastrar transação', exact: true });
    await expect(create).toBeVisible();
    expect((await new AxeBuilder({ page }).include('div:has(> h3)').analyze()).violations).toEqual(
      [],
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await create.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
  });
}
