import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  filterTransactions,
  summarizeTransactions,
  groupTransactionValues,
} from '../src/features/finance/calculations.ts';

const tx = (id, valor, tipo = 'receita', status = 'pago', data = '2026-10-05') => ({
  id,
  user_id: 'demo-user-id',
  descricao: 'Salário mensal',
  valor,
  tipo,
  status,
  data,
  forma_pagamento: 'Pix',
  categoria: tipo === 'receita' ? 'Salário' : 'Outros',
});

test('saldo considera apenas realizados e separa pendências com precisão de centavos', () => {
  const rows = [
    tx('1', 0.1),
    tx('2', 0.2),
    tx('3', 0.1, 'despesa'),
    tx('4', 30, 'receita', 'pendente'),
    tx('5', 20, 'despesa', 'pendente'),
  ];
  const stats = summarizeTransactions(rows);
  assert.equal(stats.totalEntradas, 0.3);
  assert.equal(stats.totalSaidas, 0.1);
  assert.equal(stats.saldoAtual, 0.2);
  assert.equal(stats.totalPendentesReceber, 30);
  assert.equal(stats.totalPendentesPagar, 20);
  assert.equal(stats.quantidadeTransacoes, 5);
  assert.equal(stats.taxaEconomia, (2 / 3) * 100);
});

test('filtros combinam período, tipo, situação e busca com espaços externos', () => {
  const rows = [
    tx('1', 10),
    tx('2', 20, 'receita', 'pendente'),
    tx('3', 30, 'despesa'),
    tx('4', 40, 'receita', 'pago', '2026-09-05'),
    tx('5', 50, 'receita', 'pago', '2025-10-05'),
  ];
  const filters = { type: 'receita', status: 'pago', searchTerm: '  SALÁRIO  ' };
  assert.deepEqual(
    filterTransactions(rows, { month: 9, year: 2026 }, filters).map((row) => row.id),
    ['1'],
  );
  assert.deepEqual(
    filterTransactions(rows, { month: -1, year: 2026 }, filters).map((row) => row.id),
    ['1', '4'],
  );
  assert.equal(
    filterTransactions(rows, { month: 9, year: 2026 }, { ...filters, searchTerm: '  pix  ' })
      .length,
    1,
  );
  assert.equal(
    filterTransactions(rows, { month: 9, year: 2026 }, { ...filters, searchTerm: 'ausente' })
      .length,
    0,
  );
});

test('agrupamentos dos gráficos preservam centavos e painel vazio não produz NaN', () => {
  assert.equal(groupTransactionValues([tx('1', 0.1), tx('2', 0.2)], 'forma_pagamento').Pix, 0.3);
  const empty = summarizeTransactions([]);
  assert.equal(empty.saldoAtual, 0);
  assert.equal(empty.taxaEconomia, 0);
  assert.equal(empty.quantidadeTransacoes, 0);
});

test('agrupamento aceita rótulos que coincidem com propriedades de objetos', () => {
  const rows = ['__proto__', 'constructor', 'toString'].flatMap((categoria) => [
    { ...tx(`${categoria}-1`, 0.1), categoria },
    { ...tx(`${categoria}-2`, 0.2), categoria },
  ]);
  const totals = groupTransactionValues(rows, 'categoria');
  for (const label of ['__proto__', 'constructor', 'toString']) {
    assert.equal(Object.hasOwn(totals, label), true);
    assert.equal(totals[label], 0.3);
  }
});

test('configurações dos gráficos preservam tema, valores, tooltips e movimento reduzido', async () => {
  const { createCategoryChartConfig, createPaymentChartConfig, createCashflowChartConfig } =
    await import('../src/features/finance/components/financialChartConfig.ts');
  const previousWindow = globalThis.window;
  try {
    for (const reducedMotion of [false, true]) {
      globalThis.window = {
        matchMedia: (query) => {
          assert.equal(query, '(prefers-reduced-motion: reduce)');
          return { matches: reducedMotion };
        },
      };
      for (const isLight of [false, true]) {
        const category = createCategoryChartConfig(
          { Alimentação: 12.34, Desconhecida: 5 },
          isLight,
        );
        const payment = createPaymentChartConfig({ Pix: 67.89, Desconhecido: 2 }, isLight);
        const cashflow = createCashflowChartConfig(100, 12.34, isLight);
        assert.deepEqual(category.data.labels, ['Alimentação', 'Desconhecida']);
        assert.deepEqual(category.data.datasets[0].data, [12.34, 5]);
        assert.deepEqual(category.data.datasets[0].backgroundColor, ['#f97316', '#94a3b8']);
        assert.equal(category.data.datasets[0].borderColor, isLight ? '#ffffff' : '#0f172a');
        assert.deepEqual(payment.data.datasets[0].data, [67.89, 2]);
        assert.deepEqual(payment.data.datasets[0].backgroundColor, ['#10b981', '#64748b']);
        assert.equal(payment.data.datasets[0].borderSkipped, false);
        assert.deepEqual(cashflow.data.datasets[0].data, [100, 12.34]);
        assert.equal(category.options.cutout, '68%');
        assert.equal(
          category.options.plugins.tooltip.callbacks.label({ label: 'Alimentação', raw: 12.34 }),
          ' Alimentação: R$ 12,34',
        );
        assert.equal(
          payment.options.plugins.tooltip.callbacks.label({ raw: 67.89 }),
          ' Total: R$ 67,89',
        );
        assert.equal(cashflow.options.plugins.tooltip.callbacks.label({ raw: 100 }), ' R$ 100,00');
        assert.equal(payment.options.scales.x.ticks.font.size, 10);
        assert.equal(cashflow.options.scales.x.ticks.font, undefined);
        for (const config of [category, payment, cashflow]) {
          assert.equal(config.options.animation, reducedMotion ? false : undefined);
          assert.equal(config.options.responsive, true);
          assert.equal(config.options.maintainAspectRatio, false);
        }
        for (const config of [payment, cashflow]) {
          assert.equal(config.options.scales.y.grid.color, isLight ? '#e2e8f0' : '#1e293b');
          assert.equal(config.options.scales.x.ticks.color, isLight ? '#475569' : '#94a3b8');
          assert.equal(config.options.scales.y.ticks.callback(100), 'R$ 100');
        }
        // Instâncias não podem contaminar as opções de outro gráfico ao serem atualizadas.
        payment.options.scales.y.grid.color = 'changed';
        assert.equal(
          createPaymentChartConfig({}, isLight).options.scales.y.grid.color,
          isLight ? '#e2e8f0' : '#1e293b',
        );
      }
    }
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
