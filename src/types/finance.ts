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

export interface Transaction {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  tipo: TransactionType;
  data: string; // YYYY-MM-DD
  forma_pagamento: PaymentMethod;
  status: TransactionStatus;
  categoria: Category;
  created_at?: string;
}

export interface SummaryStats {
  totalEntradas: number;
  totalSaidas: number;
  saldoAtual: number;
  totalPendentesReceber: number;
  totalPendentesPagar: number;
  taxaEconomia: number;
  quantidadeTransacoes: number;
}

export interface FilterState {
  month: number; // 0-11 or -1 for all
  year: number;
  type: 'todos' | TransactionType;
  status: 'todos' | TransactionStatus;
  categoria: string;
  formaPagamento: string;
  searchTerm: string;
}
