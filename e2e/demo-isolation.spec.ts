import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('ações na demonstração não enviam consultas nem gravações à API do banco', async ({
  page,
}) => {
  const databaseRequests: string[] = [];
  await page.route('**/rest/v1/**', async (route) => {
    databaseRequests.push(route.request().method() + ' ' + route.request().url());
    await route.fulfill({
      status: 500,
      json: { message: 'O teste proíbe acesso ao banco na demonstração.' },
    });
  });
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00-03:00'));
  await page.goto('/');
  await page
    .getByRole('link', { name: /Explorar.*(?:Demonstração|sem login)/i })
    .first()
    .click();
  await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toBeVisible();
  // Mesmo um ID no formato do banco continua sendo apenas um dado local.
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('gf_local_transactions')!);
    state.transactions.push({
      id: '11111111-1111-4111-8111-111111111111',
      user_id: 'demo-user-id',
      descricao: 'Registro exclusivamente local',
      valor: 10,
      tipo: 'despesa',
      data: '2026-10-20',
      forma_pagamento: 'Pix',
      status: 'pendente',
      categoria: 'Outros',
    });
    localStorage.setItem('gf_local_transactions', JSON.stringify(state));
  });
  await page.getByRole('button', { name: 'Recarregar lançamentos' }).click();
  await page
    .getByRole('button', { name: 'Excluir Registro exclusivamente local', exact: true })
    .first()
    .click();
  await page
    .getByRole('button', {
      name: 'Confirmar exclusão de Registro exclusivamente local',
      exact: true,
    })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: 'Editar Registro exclusivamente local', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Editar Salário Mensal', exact: true }).first().click();
  await page.getByLabel('Valor (R$)', { exact: true }).fill('7200');
  await page.getByRole('button', { name: 'Atualizar Transação' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Alterar situação de Salário Mensal', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Ver parcelas do notebook' }).click();
  await page
    .getByRole('button', { name: 'Editar Notebook para trabalho', exact: true })
    .first()
    .click();
  await page.getByLabel('Aplicar alteração').selectOption('following');
  await page.getByLabel('Cancelar este e os próximos pendentes').check();
  await page.getByRole('button', { name: 'Atualizar Transação' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: /Nova Transação/ })
    .first()
    .click();
  await page.getByLabel('Repetição', { exact: true }).selectOption('installments');
  await page.getByLabel('Número de parcelas').fill('3');
  await page.getByLabel('Descrição', { exact: true }).fill('Compra local de teste');
  await page.getByLabel('Valor total da compra (R$)', { exact: true }).fill('300');
  await page.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('gf_local_transactions')!),
  );
  expect(
    state.transactions.some((t: { id: string }) => t.id === '11111111-1111-4111-8111-111111111111'),
  ).toBe(false);
  expect(state.transactions.find((t: { id: string }) => t.id === 'demo-1').valor).toBe(7200);
  expect(
    state.transactions.filter(
      (t: { descricao: string }) => t.descricao === 'Compra local de teste',
    ),
  ).toHaveLength(3);
  expect(state.series.find((s: { id: string }) => s.id === 'demo-series-notebook').cancelled).toBe(
    true,
  );
  expect(databaseRequests).toEqual([]);
});
