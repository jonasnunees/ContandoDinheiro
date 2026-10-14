import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterTransactions, summarizeTransactions, groupTransactionValues } from '../src/features/finance/calculations.ts';

const tx = (id, valor, tipo = 'receita', status = 'pago', data = '2026-10-05') => ({
  id, user_id: 'demo-user-id', descricao: 'Salário mensal', valor, tipo, status, data,
  forma_pagamento: 'Pix', categoria: tipo === 'receita' ? 'Salário' : 'Outros',
});

test('saldo considera apenas realizados e separa pendências com precisão de centavos', () => {
  const rows = [tx('1', 0.1), tx('2', 0.2), tx('3', 0.1, 'despesa'),
    tx('4', 30, 'receita', 'pendente'), tx('5', 20, 'despesa', 'pendente')];
  const stats = summarizeTransactions(rows);
  assert.equal(stats.totalEntradas, 0.3);
  assert.equal(stats.totalSaidas, 0.1);
  assert.equal(stats.saldoAtual, 0.2);
  assert.equal(stats.totalPendentesReceber, 30);
  assert.equal(stats.totalPendentesPagar, 20);
  assert.equal(stats.quantidadeTransacoes, 5);
  assert.equal(stats.taxaEconomia, 2 / 3 * 100);
});

test('filtros combinam período, tipo, situação e busca com espaços externos', () => {
  const rows = [tx('1', 10), tx('2', 20, 'receita', 'pendente'),
    tx('3', 30, 'despesa'), tx('4', 40, 'receita', 'pago', '2026-09-05'),
    tx('5', 50, 'receita', 'pago', '2025-10-05')];
  const filters = { type: 'receita', status: 'pago', searchTerm: '  SALÁRIO  ' };
  assert.deepEqual(filterTransactions(rows, { month: 9, year: 2026 }, filters).map(row => row.id), ['1']);
  assert.deepEqual(filterTransactions(rows, { month: -1, year: 2026 }, filters).map(row => row.id), ['1', '4']);
  assert.equal(filterTransactions(rows, { month: 9, year: 2026 }, { ...filters, searchTerm: '  pix  ' }).length, 1);
  assert.equal(filterTransactions(rows, { month: 9, year: 2026 }, { ...filters, searchTerm: 'ausente' }).length, 0);
});

test('agrupamentos dos gráficos preservam centavos e painel vazio não produz NaN', () => {
  assert.equal(groupTransactionValues([tx('1', 0.1), tx('2', 0.2)], 'forma_pagamento').Pix, 0.3);
  const empty = summarizeTransactions([]);
  assert.equal(empty.saldoAtual, 0);
  assert.equal(empty.taxaEconomia, 0);
  assert.equal(empty.quantidadeTransacoes, 0);
});
