import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('fluxo demonstrativo acessível: teclado, valores, gráficos e persistência', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar.*(?:Demonstração|sem login)/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Lançamentos & Extrato', exact: false })).toBeVisible();
  const newTransaction = page.getByRole('button', { name: /Nova Transação/ }).first();
  await newTransaction.click();
  const dialog = page.getByRole('dialog', { name: 'Nova Transação' });
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement))).toBe(true);
  const results = await new AxeBuilder({ page }).include('dialog').analyze();
  expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.html) }))).toEqual([]);
  await page.keyboard.press('Shift+Tab');
  await expect.poll(() => page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(newTransaction).toBeFocused();
  await newTransaction.click();
  await page.getByLabel('Valor (R$)', { exact: true }).fill('123abc');
  await page.getByLabel('Descrição', { exact: true }).fill('Teste de acessibilidade');
  await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(dialog.getByRole('alert')).toContainText('valor válido');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('1.234,56');
  await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar transações' }).fill('Teste de acessibilidade');
  await expect(page.getByRole('cell', { name: /1.234,56/ }).first()).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Explorar.*(?:Demonstração|sem login)/i }).first().click();
  await expect(page.getByText('Teste de acessibilidade', { exact: true }).first()).toBeVisible();
  await page.getByText('Consultar valores dos gráficos em tabela').click();
  await expect(page.getByRole('table').last()).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
});

test('painel em celular e tema claro mantém nomes acessíveis', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar.*(?:Demonstração|sem login)/i }).first().click();
  await page.getByRole('button', { name: 'Mudar para tema claro' }).first().click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.html) }))).toEqual([]);
  await page.getByRole('textbox', { name: 'Buscar transações' }).fill('Nenhum lançamento com este nome');
  await expect(page.getByText('Nenhuma transação encontrada', { exact: true })).toBeVisible();
  const emptyResults = await new AxeBuilder({ page }).analyze();
  expect(emptyResults.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.html) }))).toEqual([]);
});

test('falha de armazenamento mostra erro e preserva a transação', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar.*(?:Demonstração|sem login)/i }).first().click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'Excluir Salário Mensal', exact: true }).first().click();
  await page.getByRole('button', { name: 'Confirmar exclusão de Salário Mensal', exact: true }).first().click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível concluir');
  await expect(page.getByRole('cell', { name: 'Salário Mensal', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar exclusão de Salário Mensal', exact: true }).first()).toBeEnabled();
});

test('acesso com Google tem diálogo nomeado e fecha por teclado', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar com Google', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Acesso com a Conta Google' });
  await expect(dialog).toBeVisible();
  const results = await new AxeBuilder({ page }).include('dialog').analyze();
  expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.html) }))).toEqual([]);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    await expect.poll(() => page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});
