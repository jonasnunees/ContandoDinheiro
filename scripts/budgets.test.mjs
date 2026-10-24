import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  budgetStorageKey,
  monthlySpending,
  readBudgets,
  saveBudgets,
} from '../src/features/finance/budgets.ts';

test('orçamentos isolam conta, modo, mês e ano e persistem os limites', () => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
  const key = budgetStorageKey('user', 9, 2026, false);
  saveBudgets(key, { Alimentação: 800 });
  assert.deepEqual(readBudgets(key), { Alimentação: 800 });
  for (const other of [
    budgetStorageKey('other', 9, 2026, false),
    budgetStorageKey('user', 8, 2026, false),
    budgetStorageKey('user', 9, 2025, false),
    budgetStorageKey('user', 9, 2026, true),
  ])
    assert.deepEqual(readBudgets(other), {});
  saveBudgets(key, {});
  assert.deepEqual(readBudgets(key), {});
  data.set(key, '{invalid');
  assert.throws(() => readBudgets(key));
  assert.equal(data.get(key), '{invalid');
  data.set(key, '{"Alimentação":-1}');
  assert.throws(() => readBudgets(key));
});

test('gasto mensal soma centavos e exclui receitas, pendências e outros períodos', () => {
  const tx = {
    categoria: 'Alimentação',
    tipo: 'despesa',
    status: 'pago',
    data: '2026-10-05',
    valor: 620,
  };
  assert.deepEqual(
    monthlySpending(
      [
        tx,
        { ...tx, valor: 0.1 },
        { ...tx, valor: 0.2 },
        { ...tx, tipo: 'receita' },
        { ...tx, status: 'pendente' },
        { ...tx, data: '2026-09-05' },
        { ...tx, data: '2025-10-05' },
      ],
      9,
      2026,
    ),
    { Alimentação: 620.3 },
  );
});
