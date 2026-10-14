import type { Transaction, FilterState, SummaryStats, TransactionPeriod } from './types';

export function filterTransactions(transactions: Transaction[], period: TransactionPeriod, filters: FilterState) {
  const term = filters.searchTerm.trim().toLowerCase();
  return transactions.filter(tx => {
    const [year, month] = tx.data.split('-').map(Number);
    return year === period.year && (period.month === -1 || month - 1 === period.month) &&
      (filters.type === 'todos' || filters.type === tx.tipo) &&
      (filters.status === 'todos' || filters.status === tx.status) &&
      (!term || [tx.descricao, tx.categoria, tx.forma_pagamento].some(value => value.toLowerCase().includes(term)));
  });
}

export function summarizeTransactions(transactions: Transaction[]): SummaryStats {
  let entradas = 0, saidas = 0, receber = 0, pagar = 0;
  for (const tx of transactions) {
    // Soma em centavos para preservar a precisão das duas casas decimais.
    const cents = Math.round(tx.valor * 100);
    if (tx.tipo === 'receita') {
      if (tx.status === 'pago') entradas += cents; else receber += cents;
    } else {
      if (tx.status === 'pago') saidas += cents; else pagar += cents;
    }
  }
  const saldo = entradas - saidas;
  return { totalEntradas: entradas / 100, totalSaidas: saidas / 100,
    saldoAtual: saldo / 100, totalPendentesReceber: receber / 100,
    totalPendentesPagar: pagar / 100,
    taxaEconomia: entradas > 0 && saldo > 0 ? saldo / entradas * 100 : 0,
    quantidadeTransacoes: transactions.length };
}

export function groupTransactionValues(transactions: Transaction[], field: 'categoria' | 'forma_pagamento') {
  const cents: Record<string, number> = {};
  for (const tx of transactions) cents[tx[field]] = (cents[tx[field]] || 0) + Math.round(tx.valor * 100);
  return Object.fromEntries(Object.entries(cents).map(([key, value]) => [key, value / 100]));
}
