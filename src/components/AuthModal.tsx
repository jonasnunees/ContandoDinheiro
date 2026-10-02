import React, { useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured, setStoredUser } from '../services/supabase';
import { LogIn, UserPlus, Sparkles, AlertCircle, Loader2, X, Lock, Mail, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { id: string; email: string; isDemo: boolean }) => void;
  onOpenSetup: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onOpenSetup,
  initialMode = 'login',
}) => {
  const [isLoginMode, setIsLoginMode] = useState(initialMode !== 'register');
  const [email, setEmail] = useState('');

  React.useEffect(() => {
    setIsLoginMode(initialMode !== 'register');
    setErrorMessage('');
    setSuccessNotice('');
  }, [initialMode, isOpen]);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!email || !password) {
      setErrorMessage('Por favor, informe e-mail e senha.');
      return;
    }

    if (!isConfigured) {
      // In demo mode without configured Supabase credentials
      const demoUser = {
        id: 'user-' + email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        email: email.trim().toLowerCase(),
        isDemo: true,
      };
      setStoredUser(demoUser);
      onAuthSuccess(demoUser);
      onClose();
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setErrorMessage('Cliente Supabase não está configurado.');
      return;
    }

    setLoading(true);

    try {
      if (isLoginMode) {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          const authUser = {
            id: data.user.id,
            email: data.user.email || email,
            isDemo: false,
          };
          setStoredUser(authUser);
          onAuthSuccess(authUser);
          onClose();
        }
      } else {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          if (data.session) {
            const authUser = {
              id: data.user.id,
              email: data.user.email || email,
              isDemo: false,
            };
            setStoredUser(authUser);
            onAuthSuccess(authUser);
            onClose();
          } else {
            setSuccessNotice('Conta criada com sucesso! Verifique a confirmação em seu e-mail caso habilitada no Supabase.');
          }
        }
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      let msg = err.message || 'Erro ao processar autenticação.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'E-mail ou senha incorretos.';
      } else if (msg.includes('User already registered')) {
        msg = 'Este e-mail já está cadastrado. Tente fazer login.';
      } else if (msg.includes('Password should be at least')) {
        msg = 'A senha deve ter pelo menos 6 caracteres.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser = {
      id: 'demo-user-id',
      email: 'convidado@demo.com',
      isDemo: true,
    };
    setStoredUser(guestUser);
    onAuthSuccess(guestUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative text-slate-800 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-3">
            {isLoginMode ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isLoginMode ? 'Acessar sua Conta' : 'Criar Nova Conta'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isConfigured
              ? 'Autenticação segura conectada ao seu projeto Supabase'
              : 'Entre ou use o modo convidado com dados locais'}
          </p>
        </div>

        {!isConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>Supabase ainda não configurado. Você pode entrar em <strong>Modo Demonstração</strong> ou </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSetup();
                }}
                className="underline text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer ml-1"
              >
                Conectar seu Supabase agora
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
            {successNotice}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLoginMode ? (
              <>
                <LogIn className="w-4 h-4" />
                Entrar no Sistema
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Criar Conta
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Continuar no Modo Convidado (Sem Login)
          </button>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            {isLoginMode ? (
              <span>
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(false);
                    setErrorMessage('');
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Cadastre-se grátis
                </button>
              </span>
            ) : (
              <span>
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(true);
                    setErrorMessage('');
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Fazer login
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
