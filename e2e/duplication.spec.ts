import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Transaction } from '../src/features/finance/types';

test.use({ serviceWorkers: 'block' });
for (const width of [1280, 390]) {
  test(`duplicação local em ${width}px: campos, identidade, cancelamento e séries`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    await page.clock.setFixedTime(new Date('2026-10-24T23:59:00-03:00'));
    const remote: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/rest/v1/')) remote.push(r.url());
    });
    await page.goto('/demo');
    if (width === 390) await page.getByRole('button', { name: 'Transações', exact: true }).click();
    await expect(page.getByRole('button', { name: /Duplicar lançamento/ }).first()).toBeAttached();
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('gf_local_transactions')!);
      const category = state.categories.find((c: { archived: boolean }) => !c.archived);
      state.transactions = Array.from({ length: 6 }, (_, i) => ({
        id: `tx-source-${i}`,
        user_id: 'demo-user-id',
        descricao: `Origem ${i}`,
        valor: 33.33,
        tipo: i === 0 ? 'receita' : 'despesa',
        status: i === 2 ? 'pendente' : 'pago',
        data: '2026-10-10',
        data_pagamento: i === 2 ? null : '2026-10-10',
        categoria: category.name,
        categoria_id: category.id,
        forma_pagamento: 'Boleto',
        ...(i >= 3
          ? { serie_id: `source-series-${i}`, ocorrencia: 2, ...(i === 4 ? { parcelas: 10 } : {}) }
          : {}),
      }));
      localStorage.setItem('gf_local_transactions', JSON.stringify(state));
    });
    await page.reload();
    if (width === 390) await page.getByRole('button', { name: 'Transações', exact: true }).click();
    const state = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('gf_local_transactions')!));
    for (let i = 0; i < 5; i++) {
      const original = (await state()).transactions.find(
        (t: Transaction) => t.id === `tx-source-${i}`,
      );
      const trigger = page
        .getByRole('button', { name: `Duplicar lançamento Origem ${i}`, exact: true })
        .filter({ visible: true })
        .first();
      const before = await state();
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading')).toHaveText('Duplicar lançamento');
      await expect(dialog.getByLabel('Descrição', { exact: true })).toBeFocused();
      await expect(dialog.getByLabel('Vencimento', { exact: true })).toHaveValue('2026-10-24');
      await expect(dialog.getByLabel('Repetição', { exact: true })).toHaveValue('single');
      await expect(dialog.getByRole('button', { name: 'Pendente', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(dialog.getByLabel('Data do pagamento', { exact: true })).toHaveCount(0);
      await expect(dialog.getByLabel('Valor (R$)', { exact: true })).toHaveValue('33,33');
      expect(await state()).toEqual(before);
      if (i === 0) {
        await dialog.getByRole('button', { name: 'Cadastrar Transação' }).focus();
        await page.keyboard.press('Tab');
        await expect(dialog.getByRole('button', { name: 'Fechar formulário' })).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(dialog.getByRole('button', { name: 'Cadastrar Transação' })).toBeFocused();
        expect((await new AxeBuilder({ page }).include('dialog').analyze()).violations).toEqual([]);
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
        expect(await state()).toEqual(before);
        await trigger.click();
      }
      if (i === 1) await dialog.getByLabel('Vencimento', { exact: true }).fill('2026-11-01');
      // Dispatch twice in the same turn to exercise the synchronous submission guard.
      await dialog.locator('form').evaluate((form) => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      await expect(dialog).toHaveCount(0);
      await expect(
        page.locator(`[data-focus-return="duplicate-tx-source-${i}"]`).filter({ visible: true }),
      ).toBeFocused();
      const after = await state();
      const copies = after.transactions.filter(
        (t: Transaction) => t.descricao === original.descricao && t.id !== original.id,
      );
      expect(copies).toHaveLength(1);
      expect(copies[0]).toMatchObject({
        valor: original.valor,
        tipo: original.tipo,
        forma_pagamento: original.forma_pagamento,
        categoria_id: original.categoria_id,
        status: 'pendente',
        data_pagamento: null,
      });
      expect(copies[0].serie_id).toBeUndefined();
      expect(copies[0].ocorrencia).toBeUndefined();
      expect(copies[0].parcelas).toBeUndefined();
      expect(after.transactions.find((t: Transaction) => t.id === original.id)).toEqual(original);
      expect(after.series).toEqual(before.series);
      if (i === 1)
        await expect(
          page.getByRole('status').filter({ hasText: 'Lançamento salvo' }),
        ).toContainText('01/11/2026');
    }
    // Reopen after local midnight: calculate today at the time of the action.
    await page.clock.setFixedTime(new Date('2026-10-25T00:01:00-03:00'));
    await page
      .getByRole('button', { name: 'Duplicar lançamento Origem 5', exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.getByLabel('Vencimento', { exact: true })).toHaveValue('2026-10-25');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    const beforeSeries = await state();
    await page
      .getByRole('button', { name: 'Duplicar lançamento Origem 5', exact: true })
      .filter({ visible: true })
      .click();
    await page.getByLabel('Repetição', { exact: true }).selectOption('monthly');
    await page.getByRole('button', { name: 'Cadastrar Transação' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const afterSeries = await state();
    expect(afterSeries.series).toHaveLength(beforeSeries.series.length + 1);
    expect(afterSeries.transactions.find((t: Transaction) => t.id === 'tx-source-5')).toEqual(
      beforeSeries.transactions.find((t: Transaction) => t.id === 'tx-source-5'),
    );
    expect(remote).toEqual([]);
  });
}

test('categoria arquivada exige seleção; falha preserva rascunho e permite tentar novamente', async ({
  page,
}) => {
  await page.goto('/demo');
  await expect(page.getByRole('button', { name: /Duplicar lançamento/ }).first()).toBeAttached();
  const description = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('gf_local_transactions')!);
    const source = state.transactions.find((t: Transaction) => !t.serie_id);
    state.categories.find((c: { id: string }) => c.id === source.categoria_id).archived = true;
    localStorage.setItem('gf_local_transactions', JSON.stringify(state));
    return source.descricao;
  });
  await page.reload();
  await page
    .getByRole('button', { name: `Duplicar lançamento ${description}`, exact: true })
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('status')).toContainText('Escolha uma categoria ativa');
  await expect(dialog.getByLabel('Categoria', { exact: true })).toHaveValue('');
  await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Categoria', { exact: true }).selectOption({ index: 1 });
  await dialog.getByLabel('Descrição', { exact: true }).fill('Cópia com falha');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'gf_local_transactions') throw new Error('Falha simulada');
      return original.call(this, key, value);
    };
    Object.assign(window, {
      restoreStorage: () => {
        Storage.prototype.setItem = original;
      },
    });
  });
  await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByLabel('Descrição', { exact: true })).toHaveValue('Cópia com falha');
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('gf_local_transactions')!).transactions.some(
        (t: Transaction) => t.descricao === 'Cópia com falha',
      ),
    ),
  ).toBe(false);
  await page.evaluate(() => (window as unknown as { restoreStorage: () => void }).restoreStorage());
  await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(dialog).toHaveCount(0);
});
