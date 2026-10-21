import type { Transaction, FilterState, SummaryStats, TransactionPeriod } from './types';

// Lê ano e mês da data ISO sem converter o fuso horário.
// Janeiro = 0 na interface; -1 seleciona todos os meses do ano.
export function matchesTransactionPeriod(transaction: Transaction, period: TransactionPeriod): boolean {
  const [year, month] = transaction.data.split('-').map(Number);
  return year === period.year && (period.month === -1 || month - 1 === period.month);
}

// Combina período, tipo, status e busca textual sem alterar a lista original.
// Divide a data textual para evitar conversões de fuso; o mês da interface começa em zero.
export function filterTransactions(transactions: Transaction[], period: TransactionPeriod, filters: FilterState) {
  const term = filters.searchTerm.trim().toLowerCase();
  return transactions.filter(tx => {
    return matchesTransactionPeriod(tx, period) &&
      (filters.type === 'todos' || filters.type === tx.tipo) &&
      (filters.status === 'todos' || filters.status === tx.status) &&
      (!term || [tx.descricao, tx.categoria, tx.forma_pagamento].some(value => value.toLowerCase().includes(term)));
  });
}

// Calcula o resumo da lista recebida (no painel, ela já está filtrada).
// Apenas valores pagos/recebidos afetam o saldo; os pendentes são somados separadamente.
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
  // A taxa representa a parcela das entradas realizadas que sobrou no saldo.
  // Sem entradas ou com saldo não positivo, a interface recebe zero.
  const saldo = entradas - saidas;
  return { totalEntradas: entradas / 100, totalSaidas: saidas / 100,
    saldoAtual: saldo / 100, totalPendentesReceber: receber / 100,
    totalPendentesPagar: pagar / 100,
    taxaEconomia: entradas > 0 && saldo > 0 ? saldo / entradas * 100 : 0,
    quantidadeTransacoes: transactions.length };
}

// Soma por categoria ou forma de pagamento e devolve valores em reais.
// Não filtra tipo/status: quem chama decide quais lançamentos compõem o gráfico.
export function groupTransactionValues(transactions: Transaction[], field: 'categoria' | 'forma_pagamento') {
  // Sem protótipo: rótulos vindos de dados externos não colidem com nomes
  // herdados, como "constructor" e "__proto__".
  const cents: Record<string, number> = Object.create(null);
  for (const tx of transactions) cents[tx[field]] = (cents[tx[field]] || 0) + Math.round(tx.valor * 100);
  return Object.fromEntries(Object.entries(cents).map(([key, value]) => [key, value / 100]));
}
