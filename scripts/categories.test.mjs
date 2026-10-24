import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { categoryName, categoryKey } from '../src/features/finance/categories.ts';
const read = (name) =>
  readFileSync(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8');
test('category names: trim, code points, locale-independent uniqueness', () => {
  assert.equal(categoryName('  Casa  '), 'Casa');
  for (const name of ['', ' \t\n', 'x'.repeat(61)]) assert.throws(() => categoryName(name));
  assert.equal(categoryKey('Casa'), categoryKey('casa'));
});
test('categories migration: backfill, ownership, archive and recurring inheritance', async () => {
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

    // Historical transaction and series are present before migration.
    const draft = {
      descricao: 'Teste',
      valor: 12,
      tipo: 'despesa',
      data: '2026-01-01',
      forma_pagamento: 'Pix',
      status: 'pendente',
      categoria: 'Moradia',
    };
    await db.query('SELECT public.save_transaction_series($1::jsonb,$2::jsonb)', [
      JSON.stringify(draft),
      JSON.stringify({ mode: 'installments', count: 2 }),
    ]);
    const before = (await db.query('SELECT id FROM public.transacoes ORDER BY id')).rows;
    await db.exec('RESET ROLE');
    await db.exec(
      read(
        readdirSync(new URL('../supabase/migrations', import.meta.url)).find((n) =>
          n.endsWith('_custom_categories.sql'),
        ),
      ),
    );
    await db.exec(
      `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${a}',false);`,
    );
    assert.equal((await db.query('SELECT * FROM public.categories')).rows.length, 10);
    assert.deepEqual((await db.query('SELECT id FROM public.transacoes ORDER BY id')).rows, before);
    const c = (await db.query("SELECT * FROM public.categories WHERE name='Moradia'")).rows[0];
    const custom = (
      await db.query(
        "INSERT INTO public.categories(user_id,name) VALUES ($1,'  Viagens  ') RETURNING *",
        [a],
      )
    ).rows[0];
    assert.equal(custom.name, 'Viagens');
    for (const name of ['', ' \t', 'x'.repeat(61), 'viagens'])
      await assert.rejects(
        db.query('INSERT INTO public.categories(user_id,name) VALUES ($1,$2)', [a, name]),
      );
    await assert.rejects(
      db.query('UPDATE public.categories SET name=$1 WHERE id=$2', ['Outra', custom.id]),
    );
    await assert.rejects(db.query('DELETE FROM public.categories WHERE id=$1', [custom.id]));
    await db.query('UPDATE public.categories SET archived=true WHERE id=$1', [c.id]);
    const rows = (await db.query('SELECT * FROM public.transacoes')).rows;
    await db.query('UPDATE public.transacoes SET descricao=$1 WHERE id=$2', [
      'Editado',
      rows[0].id,
    ]);
    const insert = (category, user = a) =>
      db.query(
        `INSERT INTO public.transacoes(user_id,descricao,valor,tipo,data,forma_pagamento,status,categoria,categoria_id) VALUES ($1,'Teste',1,'despesa','2026-01-01','Pix','pendente','snapshot',$2)`,
        [user, category],
      );
    await assert.rejects(insert(c.id));
    const save = (d, o, id = null) =>
      db.query('SELECT public.save_transaction_series($1::jsonb,$2::jsonb,$3::uuid)', [
        JSON.stringify(d),
        JSON.stringify(o),
        id,
      ]);
    await assert.rejects(save({ ...draft, categoria_id: c.id }, { mode: 'monthly' }));
    await save({ ...draft, categoria_id: c.id, valor: 13 }, { scope: 'following' }, rows[0].id);
    const sid = rows[0].serie_id;
    await db.query('UPDATE public.transaction_series SET next_index=0 WHERE id=$1', [sid]);
    await db.query('DELETE FROM public.transacoes WHERE serie_id=$1', [sid]);
    await db.query('SELECT public.materialize_transaction_series()');
    assert.equal(
      (await db.query('SELECT * FROM public.transacoes WHERE categoria_id=$1', [c.id])).rows.length,
      2,
    );
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${b}',false)`);
    assert.equal(
      (await db.query('SELECT * FROM public.categories WHERE id=$1', [c.id])).rows.length,
      0,
    );
    await assert.rejects(insert(c.id, b));
    await assert.rejects(save({ ...draft, categoria_id: c.id }, { mode: 'monthly' }));
    await assert.rejects(
      db.query('INSERT INTO public.categories(user_id,name) VALUES ($1,$2)', [a, 'Invasao']),
    );
    assert.equal(
      (
        await db.query('UPDATE public.categories SET archived=false WHERE id=$1 RETURNING *', [
          c.id,
        ])
      ).rows.length,
      0,
    );
    const foreignCategory = (
      await db.query("SELECT id FROM public.categories WHERE name='Moradia'")
    ).rows[0].id;
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${a}',false)`);
    await assert.rejects(
      db.query('UPDATE public.transacoes SET categoria_id=$1 WHERE serie_id=$2', [
        foreignCategory,
        sid,
      ]),
    );
    await assert.rejects(
      db.query(
        "UPDATE public.transaction_series SET template=jsonb_set(template,'{categoria_id}',to_jsonb($1::text)) WHERE id=$2",
        [foreignCategory, sid],
      ),
    );
    await assert.rejects(
      save(
        { ...draft, categoria_id: foreignCategory },
        { scope: 'following' },
        (await db.query('SELECT id FROM public.transacoes WHERE serie_id=$1', [sid])).rows[0].id,
      ),
    );
    await db.query('UPDATE public.categories SET archived=false WHERE id=$1', [c.id]);
    await insert(c.id);
    await insert(custom.id);
    await assert.rejects(
      db.query("UPDATE public.transacoes SET categoria='Outros' WHERE serie_id=$1", [sid]),
    );
    // Série válida arquivada antes da primeira materialização também deve continuar.
    const unmaterialized = (
      await db.query(
        `INSERT INTO public.transaction_series(user_id,template,mode,count) VALUES ($1,$2::jsonb,'installments',2) RETURNING id`,
        [
          a,
          JSON.stringify({
            ...draft,
            categoria_id: custom.id,
            status: 'pago',
            data_pagamento: '2026-01-01',
          }),
        ],
      )
    ).rows[0].id;
    await db.query('UPDATE public.categories SET archived=true WHERE id=$1', [custom.id]);
    await db.query('SELECT public.materialize_transaction_series()');
    const generated = (
      await db.query(
        'SELECT categoria_id,status,data_pagamento FROM public.transacoes WHERE serie_id=$1 ORDER BY ocorrencia',
        [unmaterialized],
      )
    ).rows;
    assert.equal(generated.length, 2);
    assert.ok(generated.every((t) => t.categoria_id === custom.id));
    assert.equal(generated[0].status, 'pago');
    assert.equal(generated[0].data_pagamento.toISOString().slice(0, 10), '2026-01-01');
    assert.equal(generated[1].status, 'pendente');
    assert.equal(generated[1].data_pagamento, null);
    await db.exec('RESET ROLE; SET ROLE anon');
    await assert.rejects(db.query('SELECT * FROM public.categories'));
  } finally {
    await db.close();
  }
});
