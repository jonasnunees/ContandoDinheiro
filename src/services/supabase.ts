import { localDate, isTransaction } from './validation';
import { readStorage, writeStorage } from './storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Transaction, TransactionStatus } from '../types/finance';

const STORAGE_KEYS = {
  SUPABASE_URL: 'gf_supabase_url',
  SUPABASE_ANON_KEY: 'gf_supabase_anon_key',
  LOCAL_TRANSACTIONS: 'gf_local_transactions',
};

// Exemplos usados na primeira visita ao modo de demonstração, sem acessar o banco.
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

let supabaseClient: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://szdipyjehiaupvuqtwvy.supabase.co';

// Prioriza a configuração do ambiente; se ela não existir, lê a conexão salva no navegador.
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl || envKey) return { url: envUrl || '', key: envKey || '' };
  return {
    url: readStorage(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_URL,
    key: readStorage(STORAGE_KEYS.SUPABASE_ANON_KEY) || '',
  };
}

// Restringe o endereço ao projeto permitido e aceita somente formatos de chave pública.
export function validateSupabaseCredentials(url: string, key: string): void {
  const parsed = new URL(url);
  const configuredHost = import.meta.env.VITE_SUPABASE_URL
    ? new URL(import.meta.env.VITE_SUPABASE_URL).host
    : null;
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash ||
      (parsed.pathname !== '/' && parsed.pathname !== '') ||
      (configuredHost ? parsed.host !== configuredHost : !/^[a-z0-9-]+\.supabase\.co$/.test(parsed.host))) {
    throw new Error('Use a URL HTTPS do projeto Supabase autorizado.');
  }
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return;
  try {
    const segment = key.split('.')[1];
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    if (key.split('.').length === 3 && payload.role === 'anon') return;
  } catch {
    // A assinatura da chave é validada pelo servidor; aqui verificamos o formato e o tipo.
  }
  throw new Error('Use somente a chave pública anon ou publishable; chaves secretas não são permitidas.');
}

// Salva ou remove a configuração local e atualiza a conexão reutilizada pela aplicação.
export function setSupabaseCredentials(url: string, key: string) {
  if (import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('A conexão deste ambiente é definida pela configuração da aplicação.');
  }
  if (url || key) {
    validateSupabaseCredentials(url.trim(), key.trim());
    const nextClient = createClient(url.trim(), key.trim());
    writeStorage(STORAGE_KEYS.SUPABASE_URL, url.trim());
    writeStorage(STORAGE_KEYS.SUPABASE_ANON_KEY, key.trim());
    supabaseClient = nextClient;
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
    supabaseClient = null;
  }
}

// Indica se a configuração tem formato válido; isso não testa a conexão pela internet.
export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  try {
    validateSupabaseCredentials(url, key);
    return true;
  } catch {
    return false;
  }
}

// Reutiliza a conexão criada; retorna null se a configuração estiver ausente ou inválida.
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const { url, key } = getSupabaseCredentials();
  try {
    validateSupabaseCredentials(url, key);
    supabaseClient = createClient(url, key);
    return supabaseClient;
  } catch {
    return null;
  }
}

// Confirma a identidade no servidor antes de acessar os dados de uma conta real.
async function requireAuthenticatedClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase não configurado.');
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Sessão inválida. Entre novamente com o Google.');
  return { client, user: data.user };
}

// No modo de demonstração, os lançamentos ficam apenas neste navegador.
function demoTransactions(): Transaction[] {
  return INITIAL_DEMO_TRANSACTIONS.map(tx => ({ ...tx }));
}

export function getLocalTransactions(): Transaction[] {
  const raw = readStorage(STORAGE_KEYS.LOCAL_TRANSACTIONS);
  if (!raw) return demoTransactions();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isTransaction)) return parsed;
  } catch { /* Se os dados locais estiverem danificados, usa os exemplos em memória. */ }
  return demoTransactions();
}

// Verifica os lançamentos e os transforma em texto JSON para salvar no navegador.
export function saveLocalTransactions(transactions: Transaction[]) {
  if (!transactions.every(isTransaction)) throw new Error('Dados de demonstração inválidos.');
  writeStorage(STORAGE_KEYS.LOCAL_TRANSACTIONS, JSON.stringify(transactions));
}

export interface AuthUserState {
  user: {
    id: string;
    email: string;
    isDemo: boolean;
  } | null;
}

// Pede ao Supabase o endereço de autenticação do Google; a tela fará o redirecionamento.
export async function signInWithGoogleService(): Promise<{ error?: unknown; url?: string | null }> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    return { error, url: data?.url ?? null };
  }
  return { error: new Error('Supabase não configurado') };
}

// Separa apenas os campos editáveis, evitando que a atualização troque o dono ou o ID.
function editableTransactionFields(input: Partial<Transaction>) {
  const fields = ['descricao', 'valor', 'tipo', 'data', 'forma_pagamento', 'status', 'categoria'] as const;
  return Object.fromEntries(fields.filter(field => input[field] !== undefined).map(field => [field, input[field]]));
}

// Busca lançamentos da conta confirmada; na demonstração, lê os exemplos locais.
export async function fetchTransactionsService(userId: string, isDemo: boolean, period?: { month: number; year: number }): Promise<Transaction[]> {
  if (!isDemo) {
    const { client, user } = await requireAuthenticatedClient();
    const result: Transaction[] = [];
    let offset = 0;
    // Busca em páginas e avança pela quantidade recebida, até não haver mais registros.
    while (true) {
      let query = client.from('transacoes').select('*').eq('user_id', user.id)
        .order('data', { ascending: false }).order('id', { ascending: false });
      if (period) {
        const start = period.month === -1 ? `${period.year}-01-01` : `${period.year}-${String(period.month + 1).padStart(2, '0')}-01`;
        const end = period.month === -1 ? `${period.year + 1}-01-01` : localDate(new Date(period.year, period.month + 1, 1));
        query = query.gte('data', start).lt('data', end);
      }
      const { data, error } = await query.range(offset, offset + 499);
      if (error) throw error;
      if (!data?.length) break;
      if (!data.every(isTransaction)) throw new Error('O servidor retornou transações inválidas.');
      result.push(...data);
      offset += data.length;
    }
    return result;
  }

  // Na demonstração, usa a lista salva neste navegador.
  return getLocalTransactions().filter(t => t.user_id === userId || userId === 'demo-user-id');
}

// Cria um lançamento no banco ou na lista local, conforme o modo de acesso.
export async function addTransactionService(
  transactionData: Omit<Transaction, 'id' | 'created_at'>,
  isDemo: boolean
): Promise<Transaction> {
  if (!isDemo) {
    const { client, user } = await requireAuthenticatedClient();
    const payload = { ...editableTransactionFields(transactionData), user_id: user.id };
    const { data, error } = await client
      .from('transacoes')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir no Supabase:', error);
      throw error;
    }
    return data as Transaction;
  }

  // Na demonstração, usa a lista salva neste navegador.
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

// Atualiza o lançamento pelo ID; no banco, também exige que pertença à conta atual.
export async function updateTransactionService(
  id: string,
  updates: Partial<Transaction>,
  isDemo: boolean
): Promise<Transaction> {
  if (!isDemo) {
    const { client, user } = await requireAuthenticatedClient();
    const { data, error } = await client
      .from('transacoes')
      .update(editableTransactionFields(updates))
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar no Supabase:', error);
      throw error;
    }
    return data as Transaction;
  }

  // Na demonstração, usa a lista salva neste navegador.
  const list = getLocalTransactions();
  const index = list.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Transação não encontrada.');
  const updated = { ...list[index], ...updates };
  list[index] = updated;
  saveLocalTransactions(list);
  return updated;
}

// Exclui o lançamento no banco ou remove seu ID da lista da demonstração.
export async function deleteTransactionService(id: string, isDemo: boolean): Promise<void> {
  if (!isDemo) {
    const { client, user } = await requireAuthenticatedClient();
    const { error } = await client
      .from('transacoes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar do Supabase:', error);
      throw error;
    }
    return;
  }

  // Na demonstração, usa a lista salva neste navegador.
  const list = getLocalTransactions().filter(t => t.id !== id);
  saveLocalTransactions(list);
}

// Alterna entre pago e pendente, reaproveitando o serviço de atualização.
export async function toggleStatusService(
  id: string,
  currentStatus: TransactionStatus,
  isDemo: boolean
): Promise<TransactionStatus> {
  const nextStatus: TransactionStatus = currentStatus === 'pago' ? 'pendente' : 'pago';
  await updateTransactionService(id, { status: nextStatus }, isDemo);
  return nextStatus;
}
