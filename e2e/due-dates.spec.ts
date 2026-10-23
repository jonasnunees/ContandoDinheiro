import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('pendência antiga permanece visível em outro período e registra pagamento real', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00-03:00'));
  await page.goto('/demo');
  await page
    .getByRole('button', { name: /Nova Transação/ })
    .first()
    .click();
  await page.getByLabel('Descrição', { exact: true }).fill('Conta antiga teste');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('123,45');
  await page.getByLabel('Vencimento', { exact: true }).fill('2026-09-30');
  await page.getByRole('button', { name: 'Pendente', exact: true }).click();
  await page.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const section = page.getByRole('region', { name: 'Pendências e próximos vencimentos' });
  await page.getByLabel('Mês dos lançamentos').selectOption('11');
  await expect(section.getByText('Conta antiga teste', { exact: true })).toBeVisible();
  await expect(section.getByText('Atrasada há 21 dias').first()).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .include('section[aria-labelledby="due-title"]')
    .analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  await section
    .getByRole('button', { name: 'Registrar pagamento de Conta antiga teste', exact: true })
    .click();
  await expect(page.getByLabel('Data do pagamento', { exact: true })).toHaveValue('2026-10-21');
  await expect(page.getByLabel('Vencimento', { exact: true })).toHaveValue('2026-09-30');
  await page.getByLabel('Data do pagamento', { exact: true }).fill('2026-10-15');
  await page.getByRole('button', { name: 'Atualizar Transação' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(section.getByText('Conta antiga teste', { exact: true })).toHaveCount(0);
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('gf_local_transactions')!).transactions.find(
      (t: { descricao: string }) => t.descricao === 'Conta antiga teste',
    ),
  );
  expect(saved).toMatchObject({ data: '2026-09-30', data_pagamento: '2026-10-15', status: 'pago' });
  await page.getByLabel('Mês dos lançamentos').selectOption('8');
  await page.getByRole('textbox', { name: 'Buscar transações' }).fill('Conta antiga teste');
  await expect(page.getByText('Pago: 15/10/2026').first()).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar transações para CSV' }).click();
  const stream = await (await downloadEvent).createReadStream();
  let csv = '';
  for await (const chunk of stream!) csv += chunk.toString();
  expect(csv).toContain('Vencimento');
  expect(csv).toContain('Data do pagamento');
  expect(csv).toContain('2026-09-30');
  expect(csv).toContain('2026-10-15');
  await page
    .getByRole('button', { name: 'Alterar situação de Conta antiga teste', exact: true })
    .first()
    .click();
  await expect(section.getByText('Conta antiga teste', { exact: true })).toBeVisible();
  const reopened = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('gf_local_transactions')!).transactions.find(
      (t: { descricao: string }) => t.descricao === 'Conta antiga teste',
    ),
  );
  expect(reopened.data_pagamento).toBeNull();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/pendencias-mobile.png', fullPage: true });
});
