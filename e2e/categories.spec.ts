import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
for (const width of [390, 1280]) {
  test(`categorias locais em ${width}px: criar, arquivar, editar e reativar sem banco`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/rest/v1/')) requests.push(request.url());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/demo');
    await page.getByRole('button', { name: 'Gerenciar categorias' }).click();
    const dialog = page.getByRole('dialog');
    expect((await new AxeBuilder({ page }).include('dialog').analyze()).violations).toEqual([]);
    await dialog.getByLabel('Nome da categoria').fill('  Viagens  ');
    await dialog.getByRole('button', { name: 'Criar categoria', exact: true }).click();
    await expect(dialog.getByRole('status')).toHaveText('Categoria criada.');
    await dialog.getByLabel('Nome da categoria').fill('viagens');
    await dialog.getByRole('button', { name: 'Criar categoria', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('existe');
    await dialog.getByRole('button', { name: 'Fechar', exact: true }).click();
    await page
      .getByRole('button', { name: /Nova Transação/ })
      .first()
      .click();
    await page.getByLabel('Descrição', { exact: true }).fill('Passeio categoria');
    await page.getByLabel('Valor (R$)', { exact: true }).fill('45');
    await page.getByLabel('Categoria', { exact: true }).selectOption({ label: 'Viagens' });
    await page.getByRole('button', { name: 'Cadastrar Transação' }).click();
    await expect(dialog).toHaveCount(0);
    const budgets = page.getByRole('region', { name: 'Orçamento mensal por categoria' });
    await budgets.getByRole('combobox').selectOption({ label: 'Viagens' });
    await budgets.getByLabel('Limite mensal (R$)').fill('100');
    await budgets.getByRole('button', { name: 'Salvar limite' }).click();
    await page.getByRole('button', { name: 'Gerenciar categorias' }).click();
    await dialog.getByRole('button', { name: 'Arquivar Viagens', exact: true }).click();
    await expect(dialog.getByRole('status')).toHaveText('Categoria arquivada.');
    await dialog.getByRole('button', { name: 'Fechar', exact: true }).click();
    await expect(
      budgets.getByRole('progressbar', { name: 'Orçamento de Viagens (arquivada)' }),
    ).toHaveAttribute('aria-valuenow', '45');
    await expect(
      page
        .getByRole('table', { name: 'Valores agregados dos gráficos financeiros' })
        .getByRole('row', { name: /Despesas pagas Viagens/ }),
    ).toContainText('45,00');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar transações para CSV' }).click();
    const download = await downloadPromise;
    expect(await readFile((await download.path())!, 'utf8')).toContain('Viagens');

    await page
      .getByRole('button', { name: /Nova Transação/ })
      .first()
      .click();
    await expect(
      page.getByLabel('Categoria', { exact: true }).locator('option', { hasText: 'Viagens' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page
      .getByRole('button', { name: 'Editar Passeio categoria', exact: true })
      .first()
      .click();
    await expect(
      page.getByLabel('Categoria', { exact: true }).locator('option:checked'),
    ).toHaveText('Viagens (arquivada)');
    await page.getByLabel('Descrição', { exact: true }).fill('Passeio preservado');
    await page.getByRole('button', { name: 'Atualizar Transação' }).click();
    await expect(dialog).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Editar Passeio preservado', exact: true }).first(),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Gerenciar categorias' }).click();
    await dialog.getByRole('button', { name: 'Reativar Viagens', exact: true }).click();
    await expect(dialog.getByRole('status')).toHaveText('Categoria reativada.');
    await dialog.getByRole('button', { name: 'Fechar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Gerenciar categorias' })).toBeFocused();
    expect(requests).toEqual([]);
  });
}

test('duas abas serializam nomes duplicados e rejeitam gravação com categoria recém-arquivada', async ({
  page,
  context,
}) => {
  const second = await context.newPage();
  await page.goto('/demo');
  await second.goto('/demo');
  for (const tab of [page, second]) {
    await tab.getByRole('button', { name: 'Gerenciar categorias' }).click();
    await tab.getByLabel('Nome da categoria').fill('Compartilhada');
  }
  await Promise.all(
    [page, second].map((tab) =>
      tab.getByRole('button', { name: 'Criar categoria', exact: true }).click(),
    ),
  );
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('gf_local_transactions')!).categories.filter(
            (c: { name: string }) => c.name === 'Compartilhada',
          ).length,
      ),
    )
    .toBe(1);
  await expect
    .poll(
      async () =>
        (await page.getByRole('dialog').getByRole('status').textContent()) ===
          'Categoria criada.' ||
        (await second.getByRole('dialog').getByRole('status').textContent()) ===
          'Categoria criada.',
    )
    .toBe(true);
  for (const tab of [page, second])
    await tab.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).click();
  await second.reload();
  await second
    .getByRole('button', { name: /Nova Transação/ })
    .first()
    .click();
  await second.getByLabel('Descrição', { exact: true }).fill('Tentativa após arquivo');
  await second.getByLabel('Valor (R$)', { exact: true }).fill('10');
  await second
    .getByRole('dialog')
    .getByLabel('Categoria', { exact: true })
    .selectOption({ label: 'Compartilhada' });
  await page.reload();
  await page.getByRole('button', { name: 'Gerenciar categorias' }).click();
  await page.getByRole('button', { name: 'Arquivar Compartilhada', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toHaveText('Categoria arquivada.');
  await second.getByRole('button', { name: 'Cadastrar Transação', exact: true }).click();
  await expect(second.getByRole('dialog').getByRole('alert')).toContainText('categoria ativa');
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('gf_local_transactions')!).transactions.some(
        (t: { descricao: string }) => t.descricao === 'Tentativa após arquivo',
      ),
    ),
  ).toBe(false);
  await second.close();
});
