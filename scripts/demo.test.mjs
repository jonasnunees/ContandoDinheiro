import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createDemoExamples,
  upgradeDemoExamples,
  DEMO_EXAMPLES_VERSION,
} from '../src/features/finance/demoExamples.ts';
import { isTransaction } from '../src/features/finance/validation.ts';
import { materialize } from '../src/features/finance/scheduling.ts';
import { summarizeTransactions } from '../src/features/finance/calculations.ts';

test('exemplos incluem séries reais, 3 de 10, receitas recorrentes e término', () => {
  for (const today of ['2026-10-20', '2027-01-02', '2028-02-29', '2026-12-31']) {
    const state = createDemoExamples(today);
    assert.ok(state.transactions.every(isTransaction));
    assert.equal(state.series.length, 5);
    assert.ok(state.series.some((s) => s.template.tipo === 'receita' && s.mode === 'monthly'));
    assert.ok(state.series.some((s) => s.mode === 'monthly' && s.end));
    const current = state.transactions.filter((t) => t.data.slice(0, 7) === today.slice(0, 7));
    const notebook = current.find((t) => t.serie_id === 'demo-series-notebook');
    assert.equal(notebook.ocorrencia, 2);
    assert.equal(notebook.parcelas, 10);
    assert.equal(current.find((t) => t.serie_id === 'demo-series-curso').ocorrencia, 1);
    for (const count of [6, 10]) {
      const rows = state.transactions.filter((t) => t.parcelas === count);
      assert.equal(rows.length, count);
      const cents = rows.reduce((sum, t) => sum + Math.round(t.valor * 100), 0);
      assert.equal(cents, count === 6 ? 129999 : 349990);
    }
    assert.ok(
      state.transactions.filter((t) => t.data > today).every((t) => t.status === 'pendente'),
    );
    assert.ok(state.transactions.filter((t) => t.data < today).every((t) => t.status === 'pago'));
    const future = state.transactions.filter((t) => t.data.slice(0, 7) > today.slice(0, 7));
    const stats = summarizeTransactions(future);
    assert.equal(stats.saldoAtual, 0);
    assert.ok(stats.totalPendentesReceber > 0);
    assert.ok(stats.totalPendentesPagar > 0);
    for (const s of state.series) assert.equal(materialize(s, today).length, 0);
  }
});

test('atualização dos exemplos preserva alterações, evita duplicação e respeita exclusões', () => {
  const saved = {
    transactions: [
      {
        ...createDemoExamples().transactions[0],
        id: 'custom',
        serie_id: null,
        ocorrencia: null,
        parcelas: null,
        descricao: 'Meu lançamento',
        valor: 123,
      },
    ],
    series: [],
  };
  const upgraded = upgradeDemoExamples(saved);
  assert.equal(upgraded.transactions.find((t) => t.id === 'custom').valor, 123);
  assert.equal(saved.transactions.length, 1);
  const again = upgradeDemoExamples(upgraded);
  assert.equal(again.transactions.length, upgraded.transactions.length);
  const confirmed = { ...upgraded, examplesVersion: DEMO_EXAMPLES_VERSION };
  confirmed.transactions = confirmed.transactions.filter((t) => t.id !== 'demo-series-notebook-2');
  assert.equal(
    upgradeDemoExamples(confirmed).transactions.some((t) => t.id === 'demo-series-notebook-2'),
    false,
  );
  const empty = { transactions: [], series: [] };
  assert.equal(upgradeDemoExamples(empty), empty);
});
