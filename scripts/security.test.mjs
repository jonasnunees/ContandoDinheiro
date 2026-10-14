import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import { PGlite } from '@electric-sql/pglite';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const validTx = { id: '1', user_id: 'account-a', descricao: 'Teste', valor: 10, tipo: 'receita', data: '2026-10-05', forma_pagamento: 'Pix', status: 'pago', categoria: 'Salário' };
async function loadServices({ env = {}, authenticated = true, pages = [[]], mutation = validTx, oauth = { url: 'https://example.supabase.co/auth/v1/authorize' } } = {}) {
  const calls = [];
  const user = { id: 'account-a', email: 'a@example.invalid' };
  const query = {};
  for (const method of ['select', 'eq', 'order', 'insert', 'update', 'delete', 'single', 'gte', 'lt', 'range']) {
    query[method] = (...args) => { calls.push([method, ...args]); return query; };
  }
  let single = false;
  query.single = () => { single = true; calls.push(['single']); return query; };
  query.range = (...args) => { single = false; calls.push(['range', ...args]); return query; };
  query.then = resolve => resolve({ data: single ? mutation : pages.shift() ?? [], error: null });
  const client = {
    auth: { getUser: async () => ({ data: { user: authenticated ? user : null }, error: null }), signInWithOAuth: async () => ({ data: oauth, error: null }) },
    from: table => { calls.push(['from', table]); return query; },
  };
  const storage = new Map([
    ['gf_supabase_url', 'https://example.supabase.co'],
    ['gf_supabase_anon_key', 'sb_publishable_test'],
  ]);
  const context = vm.createContext({
    URL, atob, console, window: { location: { origin: "http://localhost:3000" } },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
  });
  const dependency = new vm.SyntheticModule(['createClient'], function () {
    this.setExport('createClient', () => client);
  }, { context });
  const modules = new Map();
  function getModule(file) {
    if (!modules.has(file)) modules.set(file, new vm.SourceTextModule(stripTypeScriptTypes(read(file)), {
      context, identifier: file, initializeImportMeta: meta => { meta.env = env; },
    }));
    return modules.get(file);
  }
  const roots = [];
  for (const file of ['src/services/supabase.ts', 'src/features/finance/transactionsService.ts', 'src/features/finance/demoStorage.ts', 'src/features/auth/authService.ts']) {
    const module = getModule(file);
    if (module.status === 'unlinked') await module.link((specifier, parent) => {
      if (specifier === '@supabase/supabase-js') return dependency;
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(parent.identifier), specifier));
      return getModule(target.endsWith('.ts') ? target : target + '.ts');
    });
    if (module.status !== 'evaluated') await module.evaluate();
    roots.push(module.namespace);
  }
  return { service: Object.assign({}, ...roots), calls, storage };
}

test('CSV neutraliza fórmulas e preserva aspas e linhas dentro da célula', async () => {
  const csv = await import('../src/features/finance/csv.ts');
  for (const value of ['=1+1', '+1', '-1', '@SUM(A1)', '  =1+1', '\t=1+1', '\r=1+1', '\n=1+1', '\u0000=1+1']) {
    assert.ok(csv.escapeCSVCell(value).startsWith('"\''), JSON.stringify(value));
  }
  assert.equal(csv.escapeCSVCell('Descrição "teste",\nPix'), '"Descrição ""teste"",\nPix"');
  assert.equal(csv.serializeCSV([['Descrição', 'Valor'], ['ação', 1]]), '\uFEFF"Descrição","Valor"\r\n"ação","1"');
});

test('conexão rejeita HTTP, destino externo e chaves privilegiadas', async () => {
  const { service } = await loadServices();
  const jwt = role => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
  for (const url of ['http://example.supabase.co', 'https://attacker.invalid', 'https://example.supabase.co.attacker.invalid', 'https://user:pass@example.supabase.co', 'https://example.supabase.co?target=1']) {
    assert.throws(() => service.validateSupabaseCredentials(url, 'sb_publishable_test'));
  }
  for (const key of ['sb_secret_test', jwt('service_role'), jwt('authenticated'), 'invalid']) {
    assert.throws(() => service.validateSupabaseCredentials('https://example.supabase.co', key));
  }
  service.validateSupabaseCredentials('https://example.supabase.co', jwt('anon'));
  service.validateSupabaseCredentials('https://example.supabase.co', 'sb_publishable_test');
});

test('configuração de produção ignora alterações no navegador', async () => {
  const { service } = await loadServices({ env: {
    VITE_SUPABASE_URL: 'https://production.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_production',
  } });
  assert.equal(service.getSupabaseCredentials().url, 'https://production.supabase.co');
  assert.throws(() => service.setSupabaseCredentials('https://example.supabase.co', 'sb_publishable_test'));
});

test('CRUD real exige sessão e não usa armazenamento demo como fallback', async () => {
  const { service, calls, storage } = await loadServices({ authenticated: false });
  await assert.rejects(service.fetchTransactionsService('victim', false), /Sessão inválida/);
  await assert.rejects(service.addTransactionService({ descricao: 'teste', user_id: 'victim' }, false));
  await assert.rejects(service.updateTransactionService('id', { status: 'pago' }, false));
  await assert.rejects(service.deleteTransactionService('id', false));
  assert.equal(calls.length, 0);
  assert.equal(storage.has('gf_local_transactions'), false);
});

test('CRUD vincula consultas à sessão e bloqueia alterações de campos protegidos', async () => {
  const { service, calls } = await loadServices();
  await service.fetchTransactionsService('account-a', false);
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'account-a'));
  calls.length = 0;
  await service.addTransactionService({ descricao: 'teste', user_id: 'victim', id: 'forged', created_at: 'forged' }, false);
  const inserted = calls.find(call => call[0] === 'insert')[1][0];
  assert.equal(inserted.user_id, 'account-a');
  assert.equal(inserted.id, undefined);
  assert.equal(inserted.created_at, undefined);
  calls.length = 0;
  await service.updateTransactionService('id', { user_id: 'victim', id: 'forged', created_at: 'forged', status: 'pago' }, false);
  const updated = calls.find(call => call[0] === 'update')[1];
  assert.deepEqual(Object.keys(updated), ['status']);
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'account-a'));
  calls.length = 0;
  await service.deleteTransactionService('id', false);
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'account-a'));
});

test('OAuth retorna endereço do provedor e ausência de configuração informa erro', async () => {
  const { service } = await loadServices();
  assert.equal((await service.signInWithGoogleService()).url, 'https://example.supabase.co/auth/v1/authorize');
  const missing = await loadServices({ env: { VITE_SUPABASE_URL: 'https://example.supabase.co' } });
  assert.ok((await missing.service.signInWithGoogleService()).error);
});

test('retornos inválidos de criação e atualização são rejeitados', async () => {
  const { service } = await loadServices({ mutation: { id: 'broken' } });
  await assert.rejects(service.addTransactionService(validTx, false), /inválida/);
  await assert.rejects(service.updateTransactionService('1', { status: 'pago' }, false), /inválida/);
});

test('mudança de conta bloqueia operações iniciadas para outro proprietário', async () => {
  const { service, calls } = await loadServices();
  await assert.rejects(service.fetchTransactionsService('account-b', false), /conta mudou/);
  await assert.rejects(service.addTransactionService(validTx, false, 'account-b'), /conta mudou/);
  await assert.rejects(service.updateTransactionService('1', { status: 'pago' }, false, 'account-b'), /conta mudou/);
  await assert.rejects(service.deleteTransactionService('1', false, 'account-b'), /conta mudou/);
  assert.equal(calls.length, 0);
});

test('paginação recupera todas as páginas mesmo com limite menor da API e filtra período', async () => {
  const tx = { id: '1', user_id: 'account-a', descricao: 'Teste', valor: 10, tipo: 'receita', data: '2026-10-05', forma_pagamento: 'Pix', status: 'pago', categoria: 'Salário' };
  const { service, calls } = await loadServices({ pages: [[tx], [{ ...tx, id: '2' }], []] });
  const result = await service.fetchTransactionsService('account-a', false, { month: 9, year: 2026 });
  assert.equal(result.length, 2);
  assert.deepEqual(calls.filter(call => call[0] === 'range').map(call => call.slice(1)), [[0, 499], [1, 500], [2, 501]]);
  assert.ok(calls.some(call => call[0] === 'gte' && call[2] === '2026-10-01'));
  assert.ok(calls.some(call => call[0] === 'lt' && call[2] === '2026-11-01'));
});

test('dados locais inválidos são informados e preservados antes de qualquer gravação', async () => {
  const { service, storage } = await loadServices();
  for (const raw of ['{}', 'null', '[{"id":"broken"}]', 'invalid']) {
    storage.set('gf_local_transactions', raw);
    await assert.rejects(service.fetchTransactionsService('demo-user-id', true), /preservado/);
    await assert.rejects(service.addTransactionService(validTx, true), /preservado/);
    assert.equal(storage.get('gf_local_transactions'), raw);
  }
});

test('migração protege dados e gera auditoria no PostgreSQL local', async t => {
  const db = new PGlite();
  const accountA = '11111111-1111-4111-8111-111111111111';
  const accountB = '22222222-2222-4222-8222-222222222222';
  const sql = read('supabase/migrations/20261002210000_security_hardening.sql');
  try {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (
        id UUID PRIMARY KEY, email TEXT, raw_user_meta_data JSONB DEFAULT '{}',
        raw_app_meta_data JSONB DEFAULT '{}'
      );
      CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS
        $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
    `);
    // Uma conta anterior à instalação precisa de perfil para gravar transações.
    await db.query(`INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
      VALUES ($1, 'a@example.invalid', '{"full_name":"Conta anterior"}', '{"provider":"google"}')`, [accountA]);
    await db.exec(sql);
    await db.exec(read('supabase/migrations/20261014110059_enforce_transaction_integrity.sql'));
    await t.test('instalação recupera perfil de conta preexistente', async () => {
      const { rows } = await db.query('SELECT id, nome FROM public.usuarios');
      assert.equal(rows[0].id, accountA);
      assert.equal(rows[0].nome, 'Conta anterior');
    });
    await db.query("UPDATE public.usuarios SET nome = 'Nome personalizado' WHERE id = $1", [accountA]);
    await db.exec(read('supabase/migrations/20261002220000_backfill_existing_profiles.sql'));
    // Simulate permissive policies left by an older configuration.
    await db.exec(`
      CREATE POLICY legacy_allow_all ON public.transacoes FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY legacy_allow_logs ON public.logs_atividades FOR ALL USING (true) WITH CHECK (true);
    `);
    await db.exec(sql);
    await t.test('reaplicação preserva perfil personalizado', async () => {
      const { rows } = await db.query('SELECT nome FROM public.usuarios WHERE id = $1', [accountA]);
      assert.equal(rows[0].nome, 'Nome personalizado');
    });
    await db.query(`INSERT INTO auth.users (id, email, raw_app_meta_data) VALUES
      ($1, 'b@example.invalid', '{"provider":"google"}')`, [accountB]);

    await t.test('trigger mapeia provider sem falhar no cadastro', async () => {
      const { rows } = await db.query('SELECT provider FROM public.usuarios ORDER BY id');
      assert.deepEqual(rows.map(row => row.provider), ['google', 'google']);
    });
    await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${accountA}', false);`);
    const { rows: created } = await db.query(`INSERT INTO public.transacoes
      (descricao, valor, tipo, forma_pagamento, status, categoria)
      VALUES ('Teste A', 10, 'receita', 'Pix', 'pago', 'Outros') RETURNING id`);
    const transactionA = created[0].id;

    await t.test('API direta rejeita campos inválidos em inserções e atualizações', async () => {
      const invalidFields = [
        ['descricao', ''], ['descricao', ' \t\r\n'], ['descricao', '\u00a0\u2003\ufeff'],
        ['valor', 0], ['valor', -1], ['valor', 'NaN'], ['valor', 10000000000],
        ['categoria', 'arbitrária'], ['forma_pagamento', 'arbitrária'],
        ['data', 'infinity'], ['data', '-infinity'], ['data', '10000-01-01'],
      ];
      const valid = { descricao: 'Teste', valor: 0.01, tipo: 'receita', forma_pagamento: 'Pix', status: 'pago', categoria: 'Outros', data: '2026-10-14' };
      for (const [field, value] of invalidFields) {
        const input = { ...valid, [field]: value };
        await assert.rejects(db.query(
          'INSERT INTO public.transacoes (descricao, valor, tipo, forma_pagamento, status, categoria, data) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          Object.values(input),
        ), error => ['23514', '22003'].includes(error.code));
        await assert.rejects(db.query(
          `UPDATE public.transacoes SET ${field} = $1 WHERE id = $2`, [value, transactionA],
        ), error => ['23514', '22003'].includes(error.code));
      }
      assert.equal((await db.query('SELECT descricao FROM public.transacoes WHERE id = $1', [transactionA])).rows[0].descricao, 'Teste A');
    });

    await t.test('cliente não pode falsificar nem consultar logs', async () => {
      await assert.rejects(db.query("INSERT INTO public.logs_atividades (acao, user_id) VALUES ('falso', 'victim')"), error => error.code === '42501');
      await assert.rejects(db.query('SELECT * FROM public.logs_atividades'), error => error.code === '42501');
    });
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${accountB}', false);`);
    await t.test('conta B não acessa nem modifica registros de A mesmo com política antiga permissiva', async () => {
      assert.equal((await db.query('SELECT * FROM public.transacoes')).rows.length, 0);
      assert.equal((await db.query("UPDATE public.transacoes SET descricao = 'invadido' WHERE id = $1 RETURNING id", [transactionA])).rows.length, 0);
      assert.equal((await db.query('DELETE FROM public.transacoes WHERE id = $1 RETURNING id', [transactionA])).rows.length, 0);
      await assert.rejects(db.query(`INSERT INTO public.transacoes
        (user_id, descricao, valor, tipo, forma_pagamento, status, categoria)
        VALUES ($1, 'Inválido', 10, 'receita', 'Pix', 'pago', 'Outros')`, [accountA]), error => error.code === '42501');
    });
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${accountA}', false);`);
    await t.test('proprietário não transfere registro para outra conta', async () => {
      await assert.rejects(db.query('UPDATE public.transacoes SET user_id = $1 WHERE id = $2', [accountB, transactionA]), error => error.code === '42501');
    });
    await db.query("UPDATE public.transacoes SET status = 'pendente' WHERE id = $1", [transactionA]);
    await db.query('DELETE FROM public.transacoes WHERE id = $1', [transactionA]);
    await db.exec('RESET ROLE;');
    await t.test('CRUD direto também gera logs com identidade e horário do servidor', async () => {
      const { rows } = await db.query('SELECT user_id, user_email, acao, detalhes, created_at FROM public.logs_atividades ORDER BY created_at, acao');
      assert.equal(rows.length, 3);
      assert.deepEqual(rows.map(row => row.acao).sort(), ['criar_transacao', 'editar_transacao', 'excluir_transacao']);
      for (const row of rows) {
        assert.equal(row.user_id, accountA);
        assert.equal(row.user_email, 'a@example.invalid');
        assert.equal(row.detalhes.origem, 'banco');
        assert.equal(row.detalhes.transacao_id, transactionA);
        assert.ok(row.created_at);
      }
    });
    await db.exec('SET ROLE anon;');
    await t.test('acesso anônimo a transações e auditoria é bloqueado', async () => {
      await assert.rejects(db.query('SELECT * FROM public.transacoes'), error => error.code === '42501');
      await assert.rejects(db.query("INSERT INTO public.logs_atividades (acao) VALUES ('falso')"), error => error.code === '42501');
    });
  } finally {
    await db.close();
  }
});
