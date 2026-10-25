import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ serviceWorkers: 'block' });
for (const width of [390, 1280]) {
  test(`Ver lançamento: identidade, filtros, séries e teclado em ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.clock.setFixedTime(new Date('2026-10-25T12:00:00-03:00'));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/demo');
    await expect(page.getByLabel('Buscar transações')).toBeVisible();
    const search = page.getByLabel('Buscar transações');
    const notice = page.getByLabel('Confirmação de salvamento');
    const state = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('gf_local_transactions')!));
    for (const [index, date, mode] of [
      [0, '2026-10-25', 'single'],
      [1, '2026-11-25', 'single'],
      [2, '2027-01-25', 'installments'],
      [3, '2026-12-25', 'monthly'],
    ] as const) {
      await search.fill('não corresponde');
      await page.getByLabel('Filtrar por tipo').selectOption('receita');
      await page.getByLabel('Filtrar por situação').selectOption('pago');
      const oldMonth = await page.getByLabel('Mês dos lançamentos').inputValue();
      const oldYear = await page.getByLabel('Ano dos lançamentos').inputValue();
      await page
        .getByRole('button', { name: 'Nova Transação', exact: true })
        .filter({ visible: true })
        .first()
        .click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Descrição', { exact: true }).fill(`Destino ${index}`);
      await dialog.getByLabel('Valor (R$)', { exact: true }).fill('120');
      await dialog.getByLabel('Vencimento', { exact: true }).fill(date);
      await dialog.getByLabel('Repetição', { exact: true }).selectOption(mode);
      if (mode === 'monthly') await dialog.getByLabel('Repetir até (opcional)').fill('2027-02-25');
      await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
      await expect(dialog).toHaveCount(0);
      await expect(notice).toBeInViewport();
      await expect(page.getByLabel('Mês dos lançamentos')).toHaveValue(oldMonth);
      await expect(page.getByLabel('Ano dos lançamentos')).toHaveValue(oldYear);
      await expect(search).toHaveValue('não corresponde');
      await expect(page.getByLabel('Filtrar por tipo')).toHaveValue('receita');
      await expect(page.getByLabel('Filtrar por situação')).toHaveValue('pago');
      const saved = (await state()).transactions
        .filter((tx: { descricao: string }) => tx.descricao === `Destino ${index}`)
        .sort(
          (a: { ocorrencia: number }, b: { ocorrencia: number }) => a.ocorrencia - b.ocorrencia,
        )[0];
      const view = notice.getByRole('button', { name: 'Ver lançamento', exact: true });
      await expect(view).not.toBeFocused();
      await view.focus();
      await page.keyboard.press('Enter');
      const target = page.locator(`[data-transaction-id="${saved.id}"]`).filter({ visible: true });
      await expect(target).toBeFocused();
      await expect(target).toBeInViewport();
      await expect(notice).toBeInViewport();
      await expect(target).toHaveAttribute('data-saved-highlight', 'true');
      await expect(target.getByText('· Lançamento salvo')).toBeVisible();
      await expect(search).toHaveValue('');
      await expect(page.getByLabel('Mês dos lançamentos')).toHaveValue(
        String(Number(date.slice(5, 7)) - 1),
      );
      await expect(page.getByLabel('Ano dos lançamentos')).toHaveValue(date.slice(0, 4));
      if (index === 0 && width === 390)
        await page.screenshot({ path: 'test-results/saved-transaction-mobile.png' });
      if (index === 0)
        expect(
          (await new AxeBuilder({ page }).include('.save-notice').analyze()).violations,
        ).toEqual([]);
      // Editing a series must return the selected occurrence, including a following edit.
      if (mode !== 'single') {
        await target.getByRole('button', { name: `Editar Destino ${index}`, exact: true }).click();
        await dialog.getByLabel('Aplicar alteração').selectOption('following');
        await dialog.getByLabel('Vencimento', { exact: true }).fill('2027-03-25');
        await dialog.getByRole('button', { name: 'Atualizar Transação' }).click();
        await expect(dialog).toHaveCount(0);
        await notice.getByRole('button', { name: 'Ver lançamento' }).click();
        await expect(target).toBeFocused();
        await expect(page.getByLabel('Mês dos lançamentos')).toHaveValue('2');
        await target.getByRole('button', { name: `Editar Destino ${index}`, exact: true }).click();
        await dialog.getByLabel('Vencimento', { exact: true }).fill('2027-04-25');
        await dialog.getByRole('button', { name: 'Atualizar Transação' }).click();
        await expect(dialog).toHaveCount(0);
        await notice.getByRole('button', { name: 'Ver lançamento' }).click();
        await expect(target).toBeFocused();
        await target.getByRole('button', { name: `Editar Destino ${index}`, exact: true }).click();
        await dialog.getByLabel('Aplicar alteração').selectOption('following');
        await dialog.getByLabel('Cancelar este e os próximos pendentes').check();
        await dialog.getByRole('button', { name: 'Atualizar Transação' }).click();
        await expect(dialog).toHaveCount(0);
        await expect(notice).toContainText('Série atualizada com sucesso');
        await expect(notice.getByRole('button', { name: 'Ver lançamento' })).toHaveCount(0);
      }
    }
    await page.getByLabel('Ano dos lançamentos').selectOption('2026');
    await page.getByLabel('Mês dos lançamentos').selectOption('9');
    // Duplicate and then edit the copy: use the persisted ID, even with identical descriptions.
    const source = page.locator('[data-transaction-id]').filter({ visible: true }).first();
    const sourceId = await source.getAttribute('data-transaction-id');
    await source.getByRole('button', { name: /Duplicar lançamento/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Vencimento', { exact: true }).fill('2027-04-25');
    await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(notice).toBeInViewport();
    await notice.getByRole('button', { name: 'Ver lançamento' }).click();
    const focusedId = await page
      .locator('[data-saved-highlight]')
      .filter({ visible: true })
      .getAttribute('data-transaction-id');
    expect(focusedId).not.toBe(sourceId);
    const copy = page.locator(`[data-transaction-id="${focusedId}"]`).filter({ visible: true });
    await expect(copy).toBeFocused();
    await copy.getByRole('button', { name: /^Editar / }).click();
    await dialog.getByLabel('Vencimento', { exact: true }).fill('2027-05-25');
    await dialog.getByRole('button', { name: 'Atualizar Transação' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(notice).toBeInViewport();
    await notice.getByRole('button', { name: 'Ver lançamento' }).click();
    await expect(copy).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('falha de gravação não oferece ação; destino removido não anuncia localização', async ({
  page,
}) => {
  await page.goto('/demo');
  await expect(page.getByLabel('Buscar transações')).toBeVisible();
  await page
    .getByRole('button', { name: 'Nova Transação', exact: true })
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrição', { exact: true }).fill('Exemplo');
  await dialog.getByLabel('Valor (R$)', { exact: true }).fill('12');
  await dialog.getByLabel('Vencimento', { exact: true }).fill('2027-06-15');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'gf_local_transactions') throw new DOMException('QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver lançamento' })).toHaveCount(0);
  await page.reload();
  await page
    .getByRole('button', { name: 'Nova Transação', exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await dialog.getByLabel('Descrição', { exact: true }).fill('Exemplo');
  await dialog.getByLabel('Valor (R$)', { exact: true }).fill('12');
  await dialog.getByLabel('Vencimento', { exact: true }).fill('2027-06-15');
  await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(dialog).toHaveCount(0);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('gf_local_transactions')!);
    state.transactions = state.transactions.filter(
      (tx: { data: string }) => tx.data !== '2027-06-15',
    );
    localStorage.setItem('gf_local_transactions', JSON.stringify(state));
  });
  await page.getByRole('button', { name: 'Ver lançamento' }).click();
  const notice = page.getByLabel('Confirmação de salvamento');
  await expect(notice).toContainText('não foi possível localizá-lo');
  await expect(notice).toBeFocused();
  await expect(page.locator('[data-saved-highlight]')).toHaveCount(0);
});
for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`aguarda dados sem mover foco prematuramente: movimento ${reducedMotion}`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.emulateMedia({ reducedMotion });
    await page.goto('/demo');
    await expect(page.getByLabel('Buscar transações')).toBeVisible();
    await page
      .getByRole('button', { name: 'Nova Transação', exact: true })
      .filter({ visible: true })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Descrição', { exact: true }).fill('Destino assíncrono');
    await dialog.getByLabel('Valor (R$)', { exact: true }).fill('12');
    await dialog.getByLabel('Vencimento', { exact: true }).fill('2027-06-15');
    await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
    await expect(dialog).toHaveCount(0);
    // Segura o mesmo lock de armazenamento usado pelo serviço real da demonstração.
    // A carga do novo período só pode prosseguir após a liberação explícita.
    await page.evaluate(
      () =>
        new Promise<void>((acquired) => {
          void navigator.locks.request('contandodinheiro-demo', () => {
            acquired();
            return new Promise<void>((release) => {
              Object.assign(window, { releaseDemoRead: release });
            });
          });
        }),
    );
    const view = page.getByRole('button', { name: 'Ver lançamento' });
    await view.click();
    const waiting = page.getByRole('button', { name: 'Localizando…' });
    await expect(waiting).toBeDisabled();
    await expect(page.locator('[data-saved-highlight]')).toHaveCount(0);
    await expect(page.getByLabel('Confirmação de salvamento')).not.toContainText(
      'Lançamento localizado',
    );
    await page.evaluate(() => {
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function (options) {
        Object.assign(window, { lastRevealScroll: options });
        original.call(this, options);
      };
      (window as unknown as { releaseDemoRead: () => void }).releaseDemoRead();
    });
    const target = page.locator('[data-saved-highlight]').filter({ visible: true });
    await expect(target).toBeFocused();
    await expect(target).toContainText('Destino assíncrono');
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { lastRevealScroll: ScrollIntoViewOptions }).lastRevealScroll
            .behavior,
      ),
    ).toBe(reducedMotion === 'reduce' ? 'instant' : 'smooth');
    await page.clock.fastForward(8001);
    await expect(page.locator('[data-saved-highlight]')).toHaveCount(0);
    await expect(page.getByLabel('Confirmação de salvamento')).toBeVisible();
  });
}
