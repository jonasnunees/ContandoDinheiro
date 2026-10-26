import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readStorage } from './storage';
const STORAGE_KEYS = { SUPABASE_URL: 'gf_supabase_url', SUPABASE_ANON_KEY: 'gf_supabase_anon_key' };

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

// Com URL de ambiente, exige o mesmo host; sem ela, aceita hosts de projetos supabase.co.
// Verifica o formato de chave pública; a validade da chave é confirmada pelo servidor.
export function validateSupabaseCredentials(url: string, key: string): void {
  const parsed = new URL(url);
  const configuredHost = import.meta.env.VITE_SUPABASE_URL
    ? new URL(import.meta.env.VITE_SUPABASE_URL).host
    : null;
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname !== '/' && parsed.pathname !== '') ||
    (configuredHost
      ? parsed.host !== configuredHost
      : !/^[a-z0-9-]+\.supabase\.co$/.test(parsed.host))
  ) {
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
  throw new Error(
    'Use somente a chave pública anon ou publishable; chaves secretas não são permitidas.',
  );
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
export async function requireAuthenticatedClient(expectedUserId?: string) {
  if (expectedUserId === 'demo-user-id')
    throw new Error('A demonstração não pode acessar o banco.');
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase não configurado.');
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Sessão inválida. Entre novamente com o Google.');
  // Uma ação iniciada na conta anterior não deve gravar na conta recém-selecionada.
  if (expectedUserId && expectedUserId !== data.user.id)
    throw new Error('A conta mudou. Tente novamente na conta atual.');
  return { client, user: data.user };
}
