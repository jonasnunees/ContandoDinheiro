import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Transaction, TransactionStatus } from '../types/finance';

const STORAGE_KEYS = {
  SUPABASE_URL: 'gf_supabase_url',
  SUPABASE_ANON_KEY: 'gf_supabase_anon_key',
  LOCAL_TRANSACTIONS: 'gf_local_transactions',
  LOCAL_USER: 'gf_local_user',
};

// Initial sample transactions for instant demonstration
const INITIAL_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user-id',
    descricao: 'Salário Mensal',
    valor: 6500.0,
    tipo: 'receita',
    data: new Date().toISOString().slice(0, 8) + '05',
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
    data: new Date().toISOString().slice(0, 8) + '10',
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
    data: new Date().toISOString().slice(0, 8) + '12',
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
    data: new Date().toISOString().slice(0, 8) + '15',
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
    data: new Date().toISOString().slice(0, 8) + '18',
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
    data: new Date().toISOString().slice(0, 8) + '22',
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
    data: new Date().toISOString().slice(0, 8) + '25',
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
    data: new Date().toISOString().slice(0, 8) + '27',
    forma_pagamento: 'Pix',
    status: 'pendente',
    categoria: 'Saúde',
    created_at: new Date().toISOString(),
  },
];

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseCredentials() {
  const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
}

export function setSupabaseCredentials(url: string, key: string) {
  if (url && key) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, key.trim());
    try {
      supabaseClient = createClient(url.trim(), key.trim());
    } catch {
      supabaseClient = null;
    }
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
    supabaseClient = null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http') && key.length > 20);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const { url, key } = getSupabaseCredentials();
  if (url && key && url.startsWith('http')) {
    try {
      supabaseClient = createClient(url, key);
      return supabaseClient;
    } catch (e) {
      console.warn('Erro ao inicializar Supabase client:', e);
      return null;
    }
  }
  return null;
}

// Local mock storage handlers
export function getLocalTransactions(): Transaction[] {
  const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_TRANSACTIONS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_TRANSACTIONS, JSON.stringify(INITIAL_DEMO_TRANSACTIONS));
    return INITIAL_DEMO_TRANSACTIONS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_TRANSACTIONS;
  }
}

export function saveLocalTransactions(transactions: Transaction[]) {
  localStorage.setItem(STORAGE_KEYS.LOCAL_TRANSACTIONS, JSON.stringify(transactions));
}

export interface AuthUserState {
  user: {
    id: string;
    email: string;
    isDemo: boolean;
  } | null;
}

export function getStoredUser(): { id: string; email: string; isDemo: boolean } | null {
  const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_USER);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

export function setStoredUser(user: { id: string; email: string; isDemo: boolean } | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
  }
}

// Service functions for Transactions
export async function fetchTransactionsService(userId: string, isDemo: boolean): Promise<Transaction[]> {
  const client = getSupabaseClient();
  if (!isDemo && client) {
    const { data, error } = await client
      .from('transacoes')
      .select('*')
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações do Supabase:', error);
      throw error;
    }
    return (data as Transaction[]) || [];
  }

  // Demo fallback
  return getLocalTransactions().filter(t => t.user_id === userId || userId === 'demo-user-id');
}

export async function addTransactionService(
  transactionData: Omit<Transaction, 'id' | 'created_at'>,
  isDemo: boolean
): Promise<Transaction> {
  const client = getSupabaseClient();
  if (!isDemo && client) {
    const { data, error } = await client
      .from('transacoes')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir no Supabase:', error);
      throw error;
    }
    return data as Transaction;
  }

  // Demo fallback
  const newTx: Transaction = {
    ...transactionData,
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    created_at: new Date().toISOString(),
  };

  const list = getLocalTransactions();
  list.unshift(newTx);
  saveLocalTransactions(list);
  return newTx;
}

export async function updateTransactionService(
  id: string,
  updates: Partial<Transaction>,
  isDemo: boolean
): Promise<Transaction> {
  const client = getSupabaseClient();
  if (!isDemo && client) {
    const { data, error } = await client
      .from('transacoes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar no Supabase:', error);
      throw error;
    }
    return data as Transaction;
  }

  // Demo fallback
  const list = getLocalTransactions();
  const index = list.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Transação não encontrada.');
  const updated = { ...list[index], ...updates };
  list[index] = updated;
  saveLocalTransactions(list);
  return updated;
}

export async function deleteTransactionService(id: string, isDemo: boolean): Promise<void> {
  const client = getSupabaseClient();
  if (!isDemo && client) {
    const { error } = await client
      .from('transacoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar do Supabase:', error);
      throw error;
    }
    return;
  }

  // Demo fallback
  const list = getLocalTransactions().filter(t => t.id !== id);
  saveLocalTransactions(list);
}

export async function toggleStatusService(
  id: string,
  currentStatus: TransactionStatus,
  isDemo: boolean
): Promise<TransactionStatus> {
  const nextStatus: TransactionStatus = currentStatus === 'pago' ? 'pendente' : 'pago';
  await updateTransactionService(id, { status: nextStatus }, isDemo);
  return nextStatus;
}
