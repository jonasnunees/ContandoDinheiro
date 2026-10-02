import React, { useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured, signInWithGoogleService } from '../services/supabase';
import { Sparkles, AlertCircle, Loader2, X, CheckCircle2, ArrowRight } from 'lucide-react';

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
}) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    setErrorMessage('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      if (!isConfigured) throw new Error('Configure o Supabase para entrar com o Google.');
      const { error, url } = await signInWithGoogleService();
      if (error) throw error;
      if (!url) throw new Error('Não foi possível iniciar a autenticação com o Google.');
      window.location.assign(url);
    } catch {
      setErrorMessage('Não foi possível entrar com o Google. Verifique a configuração e tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      }
      onAuthSuccess({ id: 'demo-user-id', email: 'convidado@demo.com', isDemo: true });
      onClose();
    } catch {
      setErrorMessage('Não foi possível encerrar a sessão para entrar no modo convidado.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md max-h-[92vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-800 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Google Icon */}
        <div className="text-center mb-4 pt-1">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mb-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Acesso com a Conta Google
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Cadastre-se ou entre com 1 clique. <strong className="text-slate-800 dark:text-slate-200">Sem precisar criar ou digitar senha.</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Google Action Area */}
        <div className="space-y-2.5 mb-4">
          {/* Google selects and verifies the account during OAuth. */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm transition flex items-center justify-between shadow-md shadow-emerald-950/20 cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center p-1 shadow-sm">
                <svg className="w-full h-full" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="block text-[10px] uppercase tracking-wider text-emerald-100 font-semibold">Autenticar com o Google</span>
                <span className="text-xs sm:text-sm font-bold truncate max-w-[190px] block">Escolher minha conta</span>
              </div>
            </div>

            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">
                <span>Entrar</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </button>
        </div>

        {/* Benefits list (Zero Passwords) */}
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 mb-3.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span><strong>Zero Senhas:</strong> Sem risco de esquecer ou perder o acesso.</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span><strong>1 Clique:</strong> Cadastro e login automáticos.</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span><strong>Privacidade Total:</strong> Dados vinculados com segurança à sua conta.</span>
          </div>
        </div>

        {!isConfigured && (
          <button type="button" onClick={onOpenSetup} className="mb-3 text-xs text-emerald-600 underline">
            Configurar acesso com o Google
          </button>
        )}

        {/* Explicit guest mode */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={googleLoading}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            Explorar no Modo Convidado (Sem Login)
          </button>
        </div>
      </div>
    </div>
  );
};
