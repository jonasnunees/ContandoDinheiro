// Fonte comum das opções dos formulários, dos tipos e da validação em execução.
// Ao mudar essas listas, revise também as restrições SQL das transações.
export const PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro'] as const;
export const CATEGORIES = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Salário', 'Investimentos', 'Serviços', 'Outros'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type Category = typeof CATEGORIES[number];
export type TransactionType = 'receita' | 'despesa';
export type TransactionStatus = 'pago' | 'pendente';

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
  type: 'todos' | TransactionType;
  status: 'todos' | TransactionStatus;
  searchTerm: string;
}

// Um formulário só envia campos editáveis: identidade, proprietário e criação vêm do serviço/banco.
export type TransactionDraft = Omit<Transaction, 'id' | 'created_at' | 'user_id'>;
// Uma atualização pode enviar apenas parte desses campos, como a mudança de status.
export type TransactionUpdate = Partial<TransactionDraft>;
// Janeiro = 0, dezembro = 11; -1 representa todos os meses do ano escolhido.
export interface TransactionPeriod { month: number; year: number }
