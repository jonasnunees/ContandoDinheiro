import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import {
  monthlyDate,
  materialize,
  editFollowing,
  validateSchedule,
} from '../src/features/finance/scheduling.ts';
const draft = {
  descricao: 'Aluguel',
  valor: 100,
  tipo: 'despesa',
  data: '2026-01-31',
  forma_pagamento: 'Pix',
  status: 'pago',
  categoria: 'Moradia',
};

test('datas mensais preservam dia original, ano bissexto e virada do ano', () => {
  assert.equal(monthlyDate('2026-01-31', 1), '2026-02-28');
  assert.equal(monthlyDate('2026-01-31', 2), '2026-03-31');
  assert.equal(monthlyDate('2028-01-31', 1), '2028-02-29');
  assert.equal(monthlyDate('2026-12-31', 1), '2027-01-31');
});
test('parcelas somam exatamente o total e futuras começam pendentes', () => {
  const series = { id: 's', template: draft, mode: 'installments', count: 3, next: 0 };
  const rows = materialize(series, '2026-01-31');
  assert.deepEqual(
    rows.map((t) => t.valor),
    [33.34, 33.33, 33.33],
  );
  assert.deepEqual(
    rows.map((t) => t.status),
    ['pago', 'pendente', 'pendente'],
  );
  assert.deepEqual(
    rows.map((t) => t.ocorrencia),
    [0, 1, 2],
  );
  assert.equal(materialize(series, '2027-01-01').length, 0);
  assert.throws(() => validateSchedule(draft, { mode: 'installments', count: 361 }));
  assert.throws(() =>
    validateSchedule({ ...draft, valor: 0.02 }, { mode: 'installments', count: 3 }),
  );
});
test('recorrência estende horizonte sem recriar excluídas; edição e cancelamento preservam pagos', () => {
  const series = { id: 's', template: draft, mode: 'monthly', next: 0 };
  const rows = materialize(series, '2026-01-01');
  assert.equal(rows.length, 12);
  assert.equal(materialize(series, '2026-02-01').length, 1);
  rows[2].status = 'pago';
  const edited = editFollowing(rows, series, rows[1], { ...draft, valor: 120, data: '2026-02-28' });
  assert.equal(edited[0].valor, 100);
  assert.equal(edited[2].valor, 100);
  assert.equal(edited[3].valor, 120);
  assert.equal(edited[3].data, '2026-04-28');
  const cancelled = editFollowing(edited, series, edited[1], draft, true);
  assert.deepEqual(
    cancelled.map((t) => t.ocorrencia),
    [0, 2],
  );
  assert.equal(materialize(series, '2028-01-01').length, 0);
});
test('término inclui a data limite e primeira ocorrência futura fica pendente', () => {
  const series = { id: 's', template: draft, mode: 'monthly', end: '2026-03-31', next: 0 };
  const rows = materialize(series, '2025-12-01');
  assert.equal(rows.length, 3);
  assert.ok(rows.every((t) => t.status === 'pendente'));
});

const read = (name) =>
  readFileSync(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8');
test('PostgreSQL: séries atômicas, isolamento, geração idempotente e histórico preservado', async () => {
  const db = new PGlite();
  const a = '11111111-1111-4111-8111-111111111111',
    b = '22222222-2222-4222-8222-222222222222';
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
   CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}',raw_app_meta_data jsonb DEFAULT '{}');
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;`);
    await db.exec(read('20261002210000_security_hardening.sql'));
    await db.exec(read('20261014110059_enforce_transaction_integrity.sql'));
    await db.exec(
      read(
        readdirSync(new URL('../supabase/migrations', import.meta.url)).find((n) =>
          n.endsWith('_recurring_transactions.sql'),
        ),
      ),
    );
    await db.exec(
      read(
        readdirSync(new URL('../supabase/migrations', import.meta.url)).find((n) =>
          n.endsWith('_index_transaction_series.sql'),
        ),
      ),
    );
    await db.exec(
      read(
        readdirSync(new URL('../supabase/migrations', import.meta.url)).find((n) =>
          n.endsWith('_payment_dates.sql'),
        ),
      ),
    );
    await db.query(
      `INSERT INTO auth.users(id,email) VALUES ($1,'a@example.invalid'),($2,'b@example.invalid')`,
      [a, b],
    );
    await db.exec(
      `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${a}',false);`,
    );
    const save = async (d, o, id = null) =>
      db.query('SELECT public.save_transaction_series($1::jsonb,$2::jsonb,$3::uuid)', [
        JSON.stringify(d),
        JSON.stringify(o),
        id,
      ]);
    await save(draft, { mode: 'installments', count: 3 });
    let rows = (await db.query('SELECT * FROM public.transacoes ORDER BY ocorrencia')).rows;
    assert.deepEqual(
      rows.map((t) => Number(t.valor)),
      [33.34, 33.33, 33.33],
    );
    assert.deepEqual(
      rows.map((t) => t.data.toISOString().slice(0, 10)),
      ['2026-01-31', '2026-02-28', '2026-03-31'],
    );
    await db.query('SELECT public.materialize_transaction_series()');
    assert.equal((await db.query('SELECT * FROM public.transacoes')).rows.length, 3);
    await save({ ...draft, valor: 80, data: '2026-02-28' }, { scope: 'following' }, rows[1].id);
    rows = (await db.query('SELECT * FROM public.transacoes ORDER BY ocorrencia')).rows;
    assert.equal(Number(rows[0].valor), 33.34);
    assert.equal(Number(rows[1].valor), 80);
    await db.query("UPDATE public.transacoes SET status='pago' WHERE id=$1", [rows[2].id]);
    await save(draft, { scope: 'following', cancel: true }, rows[1].id);
    assert.equal((await db.query('SELECT * FROM public.transacoes')).rows.length, 2);
    await db.query('SELECT public.materialize_transaction_series()');
    assert.equal((await db.query('SELECT * FROM public.transacoes')).rows.length, 2);
    const seriesId = rows[0].serie_id;
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${b}',false);`);
    assert.equal((await db.query('SELECT * FROM public.transaction_series')).rows.length, 0);
    await assert.rejects(save(draft, { scope: 'following' }, rows[0].id));
    await assert.rejects(
      db.query(
        `INSERT INTO public.transacoes(user_id,descricao,valor,tipo,data,forma_pagamento,status,categoria,serie_id,ocorrencia)
   VALUES ($1,'Invasão',1,'despesa','2026-01-01','Pix','pendente','Outros',$2,9)`,
        [b, seriesId],
      ),
    );
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${a}',false);`);
    await assert.rejects(
      save({ ...draft, categoria: 'Inválida' }, { mode: 'installments', count: 2 }),
    );
    assert.equal((await db.query('SELECT * FROM public.transaction_series')).rows.length, 1);
    await save(draft, { mode: 'monthly', end: '2026-03-31' });
    assert.equal((await db.query('SELECT * FROM public.transacoes')).rows.length, 5);
    // Horizonte móvel no banco, exclusão isolada e atualização sem regenerar exceções.
    const currentMonth = (
      await db.query(
        "SELECT to_char(date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM-DD') AS day",
      )
    ).rows[0].day;
    await save({ ...draft, data: currentMonth }, { mode: 'monthly' });
    const rolling = (
      await db.query(
        "SELECT * FROM public.transaction_series WHERE mode='monthly' AND end_date IS NULL",
      )
    ).rows[0];
    assert.equal(
      (await db.query('SELECT * FROM public.transacoes WHERE serie_id=$1', [rolling.id])).rows
        .length,
      12,
    );
    const rollingRows = (
      await db.query('SELECT * FROM public.transacoes WHERE serie_id=$1 ORDER BY ocorrencia', [
        rolling.id,
      ])
    ).rows;
    await db.query('DELETE FROM public.transacoes WHERE id=$1', [rollingRows[1].id]);
    await db.query('SELECT public.materialize_transaction_series()');
    assert.equal(
      (await db.query('SELECT * FROM public.transacoes WHERE serie_id=$1', [rolling.id])).rows
        .length,
      11,
    );
    // Simula a série criada um mês antes, para conferir a extensão do horizonte.
    await db.query(
      "UPDATE public.transaction_series SET template=jsonb_set(template,'{data}',to_jsonb(public.transaction_month($1::date,-1)::text)) WHERE id=$2",
      [currentMonth, rolling.id],
    );
    await db.query('SELECT public.materialize_transaction_series()');
    const extended = (
      await db.query('SELECT * FROM public.transacoes WHERE serie_id=$1 ORDER BY ocorrencia', [
        rolling.id,
      ])
    ).rows;
    assert.equal(extended.length, 12);
    assert.equal(extended.at(-1).ocorrencia, 12);
    // Solicitações sobrepostas são serializadas por esta conexão de teste.
    // Exercita idempotência real no banco; bloqueios entre sessões exigem PostgreSQL.
    await Promise.all(
      Array.from({ length: 4 }, () => db.query('SELECT public.materialize_transaction_series()')),
    );
    const repeated = (
      await db.query('SELECT * FROM public.transacoes WHERE serie_id=$1 ORDER BY ocorrencia', [
        rolling.id,
      ])
    ).rows;
    assert.deepEqual(repeated, extended);
    assert.equal(new Set(repeated.map((row) => row.ocorrencia)).size, repeated.length);

    await assert.rejects(save({ ...draft, valor: -1 }, { scope: 'following' }, extended[0].id));
    assert.equal(
      Number(
        (await db.query('SELECT valor FROM public.transacoes WHERE id=$1', [extended[2].id]))
          .rows[0].valor,
      ),
      100,
    );
    await save({ ...draft, data: '2100-01-31' }, { mode: 'installments', count: 2 });
    assert.ok(
      (
        await db.query("SELECT status FROM public.transacoes WHERE data >= '2100-01-01'")
      ).rows.every((t) => t.status === 'pendente'),
    );
    // Pagamento real persiste; reabrir limpa a data, sem inventar histórico antigo.
    const paidId = extended[0].id;
    await db.query(
      "UPDATE public.transacoes SET status='pago',data_pagamento='2026-01-15' WHERE id=$1",
      [paidId],
    );
    assert.equal(
      (
        await db.query('SELECT data_pagamento FROM public.transacoes WHERE id=$1', [paidId])
      ).rows[0].data_pagamento
        .toISOString()
        .slice(0, 10),
      '2026-01-15',
    );
    await assert.rejects(
      db.query("UPDATE public.transacoes SET data_pagamento='9999-01-01' WHERE id=$1", [paidId]),
    );
    await db.query("UPDATE public.transacoes SET status='pendente' WHERE id=$1", [paidId]);
    assert.equal(
      (await db.query('SELECT data_pagamento FROM public.transacoes WHERE id=$1', [paidId])).rows[0]
        .data_pagamento,
      null,
    );
    await save({ ...draft, data_pagamento: '2026-01-15' }, { mode: 'installments', count: 2 });
    const paidSeries = (
      await db.query("SELECT * FROM public.transacoes WHERE data_pagamento='2026-01-15'")
    ).rows;
    assert.equal(paidSeries.length, 1);
    await db.exec('RESET ROLE; SET ROLE anon;');
    await assert.rejects(db.query('SELECT public.materialize_transaction_series()'));
  } finally {
    await db.close();
  }
});
