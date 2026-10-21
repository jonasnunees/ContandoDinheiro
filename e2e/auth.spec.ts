import { test, expect, type Page } from '@playwright/test';

// Substitui apenas a infraestrutura externa. React, hooks, formulários,
// paginação, validação e composição são os mesmos usados pela aplicação.
const infrastructure = `
let user = { id: 'account-a', email: 'a@example.invalid' }, callback, failSignOut = false;
window.addEventListener('test-auth', event => {
  const detail = event.detail;
  user = detail.user;
  failSignOut = detail.failSignOut || false;
  callback(detail.event, user ? { user } : null);
});
const client = { async rpc() { return { data: null, error: null }; }, auth: {
  onAuthStateChange(fn) {
    callback = fn;
    setTimeout(() => fn('INITIAL_SESSION', user ? { user } : null), 0);
    return { data: { subscription: { unsubscribe() {} } } };
  },
  async getUser() { return { data: { user }, error: null }; },
  async signOut() {
    if (failSignOut) return { error: new Error('offline') };
    user = null; callback('SIGNED_OUT', null); return { error: null };
  },
  async signInWithOAuth() { return { data: { url: null }, error: new Error('oauth unavailable') }; }
}, from() {
  const args = { account: user.id, offset: 0, action: 'read' };
  const query = {};
  for (const method of ['select', 'eq', 'order', 'gte', 'lt', 'single']) query[method] = () => query;
  query.eq = (field, value) => { if (field === 'user_id') args.account = value; return query; };
  query.range = offset => { args.offset = offset; return query; };
  for (const method of ['insert', 'update', 'delete']) query[method] = () => { args.action = method; return query; };
  query.then = (resolve, reject) => fetch('/__test_transactions?' + new URLSearchParams(args))
    .then(response => response.json()).then(data => resolve({ data, error: null }), reject);
  return query;
} };
export const getSupabaseClient = () => client;
export const isSupabaseConfigured = () => true;
export async function requireAuthenticatedClient(expected) {
  const { data } = await client.auth.getUser();
  if (!data.user || (expected && expected !== data.user.id)) throw new Error('Conta inválida');
  return { client, user: data.user };
}
`;

async function authEvent(page: Page, event: string, id: string | null = 'account-a', failSignOut = false) {
  await page.evaluate(detail => window.dispatchEvent(new CustomEvent('test-auth', { detail })), {
    event, user: id ? { id, email: `${id}@example.invalid` } : null, failSignOut,
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('**/src/services/supabase.ts*', route => route.fulfill({ contentType: 'application/javascript', body: infrastructure }));
  await page.route('**/__test_transactions?*', async route => {
    const url = new URL(route.request().url());
    const account = url.searchParams.get('account');
    const date = new Date();
    const tx = { id: `tx-${account}`, user_id: account, descricao: `Lançamento ${account}`, valor: 123.45,
      tipo: 'receita', status: 'pago', data: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-05`,
      forma_pagamento: 'Pix', categoria: 'Salário' };
    await route.fulfill({ json: Number(url.searchParams.get('offset')) > 0 ? [] : [tx] });
  });
});

test('renovar sessão e repetir login preserva formulário e filtros', async ({ page }) => {
  let reads = 0;
  page.on('request', request => { if (request.url().includes('/__test_transactions?')) reads++; });
  await page.goto('/');
  await expect(page.getByRole('cell', { name: 'Lançamento account-a', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar transações' }).fill('  Lançamento account-a  ');
  await expect(page.getByRole('cell', { name: 'Lançamento account-a', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Nova Transação/ }).first().click();
  await page.getByLabel('Descrição', { exact: true }).fill('Rascunho preservado');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('250,50');
  const baseline = reads;
  for (const event of ['TOKEN_REFRESHED', 'SIGNED_IN']) {
    await authEvent(page, event);
    await expect(page.getByRole('dialog', { name: 'Nova Transação' })).toBeVisible();
    await expect(page.getByLabel('Descrição', { exact: true })).toHaveValue('Rascunho preservado');
    await expect(page.getByLabel('Valor (R$)', { exact: true })).toHaveValue('250,50');
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('textbox', { name: 'Buscar transações' })).toHaveValue('  Lançamento account-a  ');
  expect(reads).toBe(baseline);
});

test('troca de conta fecha formulário e elimina dados da anterior', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('cell', { name: 'Lançamento account-a', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Nova Transação/ }).first().click();
  await page.getByLabel('Descrição', { exact: true }).fill('Rascunho da conta A');
  await authEvent(page, 'SIGNED_IN', 'account-b');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'Lançamento account-b', exact: true })).toBeVisible();
  await expect(page.getByText('Lançamento account-a', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /Nova Transação/ }).first().click();
  await expect(page.getByLabel('Descrição', { exact: true })).toHaveValue('');
});

test('resposta antiga de outra conta não volta à interface', async ({ page }) => {
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const waiting = new Promise<void>(resolve => { started = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/__test_transactions?*account=account-a*', async route => {
    if (Number(new URL(route.request().url()).searchParams.get('offset')) > 0) {
      await route.fulfill({ json: [] });
      return;
    }
    started?.(); await gate;
    await route.fulfill({ json: [{ id: 'old', user_id: 'account-a', descricao: 'Dados atrasados da conta A', valor: 10,
      tipo: 'receita', status: 'pago', data: '2026-10-05', forma_pagamento: 'Pix', categoria: 'Salário' }] });
  });
  await page.goto('/');
  await waiting;
  await authEvent(page, 'SIGNED_IN', 'account-b');
  await expect(page.getByRole('cell', { name: 'Lançamento account-b', exact: true })).toBeVisible();
  const completed = page.waitForResponse(response => response.url().includes('account=account-a') && response.url().includes('offset=1'));
  release?.();
  await (await completed).finished();
  await expect(page.getByText('Dados atrasados da conta A', { exact: true })).toHaveCount(0);
});

test('falha ao sair preserva painel; saída confirmada volta à apresentação', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('cell', { name: 'Lançamento account-a', exact: true })).toBeVisible();
  await authEvent(page, 'TOKEN_REFRESHED', 'account-a', true);
  await page.getByRole('button', { name: /Sair/i }).first().click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível sair');
  await expect(page.getByRole('cell', { name: 'Lançamento account-a', exact: true })).toBeVisible();
  await authEvent(page, 'TOKEN_REFRESHED');
  await page.getByRole('button', { name: /Sair/i }).first().click();
  await expect(page.getByRole('button', { name: 'Entrar com Google', exact: true })).toBeVisible();
});

for (const scenario of ['erro do provedor', 'endereço ausente']) {
  test(`OAuth com ${scenario} informa falha sem abrir uma conta`, async ({ page }) => {
    if (scenario === 'endereço ausente') {
      await page.route('**/src/services/supabase.ts*', route => route.fulfill({
        contentType: 'application/javascript',
        body: infrastructure.replace("error: new Error('oauth unavailable')", 'error: null'),
      }));
    }
    await page.goto('/');
    await expect(page.getByRole('cell', { name: 'Lançamento account-a', exact: true })).toBeVisible();
    await authEvent(page, 'SIGNED_OUT', null);
    await page.getByRole('button', { name: 'Entrar com Google', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Acesso com a Conta Google' });
    await dialog.getByRole('button', { name: /Escolher minha conta/ }).click();
    await expect(dialog.getByRole('alert')).toContainText('Não foi possível entrar');
    await expect(page.getByRole('heading', { name: /Lançamentos & Extrato/ })).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/');
  });
}

for (const width of [390, 1280]) {
  test(`sair da demonstração preserva a conta conectada em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      if (localStorage.getItem('audit-signouts') === null) localStorage.setItem('audit-signouts', '0');
    });
    await page.route('**/src/services/supabase.ts*', route => route.fulfill({
      contentType: 'application/javascript',
      body: infrastructure.replace('async signOut() {',
        "async signOut() { localStorage.setItem('audit-signouts', String(Number(localStorage.getItem('audit-signouts')) + 1));"),
    }));
    const reads: string[] = [];
    page.on('request', request => { if (request.url().includes('/__test_transactions?')) reads.push(request.url()); });
    await page.goto('/demo');
    await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toBeVisible();
    expect(reads).toEqual([]);
    if (width === 390) await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    await page.getByRole('link', { name: 'Sair da demonstração', exact: true }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole(width === 390 ? 'heading' : 'cell', { name: 'Lançamento account-a', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('audit-signouts'))).toBe('0');
  });
}
