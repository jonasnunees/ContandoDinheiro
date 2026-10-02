import React, { useState } from 'react';
import { SUPABASE_SQL_SCRIPT } from '../services/supabase-sql';
import { getSupabaseCredentials, getSupabaseClient, setSupabaseCredentials, validateSupabaseCredentials, isSupabaseConfigured } from '../services/supabase';
import { Database, Copy, Check, ExternalLink, X, ShieldCheck, KeyRound, Terminal, AlertCircle } from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsSaved: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onCredentialsSaved,
}) => {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [key, setKey] = useState(currentCreds.key);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const [savingCredentials, setSavingCredentials] = useState(false);
  const isManagedConnection = Boolean(import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_ANON_KEY);
  const [activeTab, setActiveTab] = useState<'sql' | 'google' | 'creds' | 'instructions'>('sql');

  if (!isOpen) return null;

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isManagedConnection || savingCredentials) return;
    setSavingCredentials(true);
    setCredentialsError('');
    try {
      validateSupabaseCredentials(url.trim(), key.trim());
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      }
      setSupabaseCredentials(url, key);
    } catch (error) {
      setCredentialsError(error instanceof Error ? error.message : 'Não foi possível salvar a conexão.');
      setSavingCredentials(false);
      return;
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setSavingCredentials(false);
      onCredentialsSaved();
      onClose();
    }, 1200);
  };

  const handleClearCredentials = async () => {
    if (isManagedConnection || savingCredentials) return;
    setSavingCredentials(true);
    setCredentialsError('');
    try {
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      }
      setSupabaseCredentials('', '');
    } catch (error) {
      setCredentialsError(error instanceof Error ? error.message : 'Não foi possível desconectar.');
      setSavingCredentials(false);
      return;
    }
    setUrl('');
    setKey('');
    setSavingCredentials(false);
    onCredentialsSaved();
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Setup do Supabase & Banco de Dados
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Etapa 1
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instruções completas para criar a tabela transações e conectar sua conta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 gap-3 sm:gap-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            1. Script SQL & Trigger
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'google'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            2. Ativar Google Auth
          </button>
          <button
            onClick={() => setActiveTab('creds')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'creds'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            3. Conectar API {isConfigured && '✓'}
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'instructions'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            4. Como Funciona o RLS
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tabelas e Automações:</span>
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    usuarios (mapeada com Google via Trigger) + transacoes (RLS por user_id)
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition cursor-pointer shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed shadow-inner">
                  {SUPABASE_SQL_SCRIPT}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <strong>O que este script faz:</strong> Cria a tabela <code className="font-bold">usuarios</code> com os dados do Google (nome, email, avatar), configura o trigger automático <code className="font-bold">on_auth_user_created</code>, cria a tabela <code className="font-bold">transacoes</code> com chave estrangeira e ativa as políticas RLS para que ninguém veja os dados de outro usuário.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'google' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Como habilitar o Google Provider no Supabase
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Para que os usuários façam login com a conta Google diretamente no seu projeto Supabase, siga este passo a passo simples de 3 minutos:
                </p>

                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Acesse o Supabase Dashboard</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Vá em <strong>Authentication</strong> &gt; <strong>Providers</strong> &gt; clique em <strong>Google</strong>.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Ative a opção "Enable Google provider"</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Copie o link indicado em <strong>Redirect URL</strong> (ex: <code className="text-emerald-600 dark:text-emerald-400">https://xyz.supabase.co/auth/v1/callback</code>).</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Adicione as chaves no Supabase</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Insira o <strong>Client ID</strong> e o <strong>Client Secret</strong> obtidos no Google Cloud Console e clique em <strong>Save</strong>.</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Resultado:</strong> Cada login do Google dispara o script SQL, salvando o usuário em <code className="font-bold">public.usuarios</code> e recuperando todas as suas receitas e despesas de <code className="font-bold">public.transacoes</code> automaticamente em tempo real!
                </div>
              </div>
            </div>
          )}

          {activeTab === 'creds' && (
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status da Conexão
                  </span>
                  {isConfigured ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" /> Supabase Configurado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      Modo Demonstração (Armazenamento Local Ativo)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Insira a <strong>Project URL</strong> e a <strong>anon / public Key</strong> encontradas em: <em>Supabase Dashboard &gt; Project Settings &gt; API</em>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Project URL (ex: https://xyzcompany.supabase.co)
                </label>
                <input
                  type="url"
                  value={url}
                  disabled={isManagedConnection || savingCredentials}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://sua-empresa.supabase.co"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Anon / Public Key
                </label>
                <input
                  type="password"
                  value={key}
                  disabled={isManagedConnection || savingCredentials}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {isConfigured && !isManagedConnection && (
                  <button
                    type="button"
                    onClick={handleClearCredentials}
                    disabled={savingCredentials}
                    className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 underline cursor-pointer"
                  >
                    Desconectar e Voltar ao Modo Demonstração
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={isManagedConnection || savingCredentials}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition flex items-center gap-2 shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        Salvo com Sucesso!
                      </>
                    ) : (
                      'Salvar Credenciais'
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'creds' && isManagedConnection && (
            <p className="text-xs">A conexão deste ambiente é definida pela configuração da aplicação.</p>
          )}
          {credentialsError && <p role="alert" className="text-sm text-rose-600">{credentialsError}</p>}

          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Isolamento de Dados com Row Level Security (RLS)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O Supabase utiliza o <strong>Row Level Security (RLS)</strong> do PostgreSQL para garantir que cada usuário autenticado tenha acesso estritamente aos seus próprios registros.
                </p>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">1. SELECT:</span> Bloqueia qualquer tentativa de visualizar transações de outros usuários (<code className="text-slate-700 dark:text-slate-300 font-mono">auth.uid() = user_id</code>).
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">2. INSERT:</span> Garante que novos registros só possam ser inseridos com o ID do usuário atualmente logado.
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">3. UPDATE & DELETE:</span> Impossibilita alterar ou apagar registros de terceiros.
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <a
                  href="https://supabase.com/docs/guides/database/postgres/row-level-security"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Documentação oficial do Supabase RLS
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
