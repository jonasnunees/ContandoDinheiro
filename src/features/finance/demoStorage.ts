import { localDate, isTransaction } from './validation';
import { readStorage, writeStorage } from '../../services/storage';
import type { Transaction } from './types';
const STORAGE_KEYS = { LOCAL_TRANSACTIONS: 'gf_local_transactions' };

// Exemplos datados no mês em que este módulo é carregado. Não são dados de uma conta real.
const INITIAL_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user-id',
    descricao: 'Salário Mensal',
    valor: 6500.0,
    tipo: 'receita',
    data: localDate().slice(0, 8) + '05',
    forma_pagamento: 'Pix',
    status: 'pago',
    categoria: 'Salário',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    user_id: 'demo-user-id',
    descricao: 'Aluguel do Apartamento',
    valor: 1850.0,
    tipo: 'despesa',
    data: localDate().slice(0, 8) + '10',
    forma_pagamento: 'Boleto',
    status: 'pago',
    categoria: 'Moradia',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    user_id: 'demo-user-id',
    descricao: 'Supermercado Mensal',
    valor: 920.45,
    tipo: 'despesa',
    data: localDate().slice(0, 8) + '12',
    forma_pagamento: 'Cartão de Débito',
    status: 'pago',
    categoria: 'Alimentação',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    user_id: 'demo-user-id',
    descricao: 'Projeto Freelance Web',
    valor: 1400.0,
    tipo: 'receita',
    data: localDate().slice(0, 8) + '15',
    forma_pagamento: 'Pix',
    status: 'pago',
    categoria: 'Serviços',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-5',
    user_id: 'demo-user-id',
    descricao: 'Combustível Posto Ipiranga',
    valor: 260.0,
    tipo: 'despesa',
    data: localDate().slice(0, 8) + '18',
    forma_pagamento: 'Cartão de Crédito',
    status: 'pago',
    categoria: 'Transporte',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-6',
    user_id: 'demo-user-id',
    descricao: 'Fatura Cartão de Crédito',
    valor: 1140.8,
    tipo: 'despesa',
    data: localDate().slice(0, 8) + '22',
    forma_pagamento: 'Boleto',
    status: 'pendente',
    categoria: 'Outros',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-7',
    user_id: 'demo-user-id',
    descricao: 'Rendimento de Dividendos',
    valor: 235.5,
    tipo: 'receita',
    data: localDate().slice(0, 8) + '25',
    forma_pagamento: 'Transferência',
    status: 'pago',
    categoria: 'Investimentos',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-8',
    user_id: 'demo-user-id',
    descricao: 'Plano de Saúde e Farmácia',
    valor: 380.0,
    tipo: 'despesa',
    data: localDate().slice(0, 8) + '27',
    forma_pagamento: 'Pix',
    status: 'pendente',
    categoria: 'Saúde',
    created_at: new Date().toISOString(),
  },
];

// Copia os objetos para que alterações na lista não modifiquem os exemplos originais.
function demoTransactions(): Transaction[] {
  return INITIAL_DEMO_TRANSACTIONS.map(tx => ({ ...tx }));
}

// Sem conteúdo salvo, oferece exemplos. Uma lista vazia salva continua vazia:
// excluir todos os lançamentos não deve recriar a demonstração.
// JSON inválido gera erro e permanece intacto para permitir recuperação.
export function getLocalTransactions(): Transaction[] {
  const raw = readStorage(STORAGE_KEYS.LOCAL_TRANSACTIONS);
  if (!raw) return demoTransactions();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isTransaction)) return parsed;
  } catch { /* Preserva o conteúdo original para permitir recuperação. */ }
  throw new Error('Os dados da demonstração estão inválidos. O conteúdo salvo foi preservado; não foi substituído por exemplos.');
}

// Verifica os lançamentos e os transforma em texto JSON para salvar no navegador.
export function saveLocalTransactions(transactions: Transaction[]) {
  if (!transactions.every(isTransaction)) throw new Error('Dados de demonstração inválidos.');
  writeStorage(STORAGE_KEYS.LOCAL_TRANSACTIONS, JSON.stringify(transactions));
}
