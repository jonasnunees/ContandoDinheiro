// Os tipos definem quais valores e campos o código aceita, ajudando a evitar erros ao programar.
export type TransactionType = 'receita' | 'despesa';

export type TransactionStatus = 'pago' | 'pendente';

export type PaymentMethod = 
  | 'Pix' 
  | 'Cartão de Crédito' 
  | 'Cartão de Débito' 
  | 'Dinheiro' 
  | 'Boleto' 
  | 'Transferência' 
  | 'Outro';

export type Category = 
  | 'Alimentação'
  | 'Moradia'
  | 'Transporte'
  | 'Saúde'
  | 'Educação'
  | 'Lazer'
  | 'Salário'
  | 'Investimentos'
  | 'Serviços'
  | 'Outros';

// Descreve um lançamento: a quem pertence, seu valor, sua data e sua classificação.
export interface Transaction {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  tipo: TransactionType;
  data: string; // Texto no formato ano-mês-dia, por exemplo: 2026-10-05.
  forma_pagamento: PaymentMethod;
  status: TransactionStatus;
  categoria: Category;
  created_at?: string;
}

// Agrupa os totais calculados para os cartões do painel.
export interface SummaryStats {
  totalEntradas: number;
  totalSaidas: number;
  saldoAtual: number;
  totalPendentesReceber: number;
  totalPendentesPagar: number;
  taxaEconomia: number;
  quantidadeTransacoes: number;
}

// Reúne as escolhas dos filtros e o texto da busca.
export interface FilterState {
  month: number; // Janeiro = 0, dezembro = 11; -1 representa o ano inteiro.
  year: number;
  type: 'todos' | TransactionType;
  status: 'todos' | TransactionStatus;
  categoria: string;
  formaPagamento: string;
  searchTerm: string;
}
