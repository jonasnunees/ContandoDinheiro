import { signInWithGoogleService } from './authService';
import { LegalLinks } from '../legal/LegalLinks';
import { Modal } from '../../components/Modal';
import React, { useState } from 'react';
import { isSupabaseConfigured } from '../../services/supabase';
import { Sparkles, AlertCircle, Loader2, X, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Notifica a escolha da demonstração. A sessão real é acompanhada por useSession
  // após o retorno do Google; este callback não autentica a identidade recebida.
  onAuthSuccess: (user: { id: string; email: string; isDemo: boolean }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Limpa mensagens anteriores quando a janela abre ou fecha.
  React.useEffect(() => {
    setErrorMessage('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  // Obtém o endereço de login e leva a pessoa ao Google para escolher sua conta.
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      if (!isConfigured)
        throw new Error('O acesso está temporariamente indisponível. Tente novamente mais tarde.');
      const { error, url } = await signInWithGoogleService();
      if (error) throw error;
      if (!url) throw new Error('Não foi possível iniciar a autenticação com o Google.');
      window.location.assign(url);
    } catch {
      setErrorMessage(
        'Não foi possível entrar com o Google. Verifique a configuração e tente novamente.',
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // A demonstração usa uma página e identidade locais e preserva a sessão conectada.
  const handleGuestLogin = () => {
    onAuthSuccess({ id: 'demo-user-id', email: 'convidado@demo.com', isDemo: true });
    onClose();
  };

  return (
    <Modal
      titleId="auth-title"
      onClose={onClose}
      busy={googleLoading}
      className="relative w-full max-w-sm sm:max-w-md max-h-[92vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-800 dark:text-slate-100 transition-colors"
    >
      <button
        onClick={onClose}
        disabled={googleLoading}
        className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Apresenta a janela de acesso e o botão de fechar. */}
      <div className="text-center mb-4 pt-1">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mb-2">
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>
        <h2
          id="auth-title"
          className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          Acesso com a Conta Google
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
          Cadastre-se ou entre com 1 clique.{' '}
          <strong className="text-slate-800 dark:text-slate-200">
            Sem precisar criar ou digitar senha.
          </strong>
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-3.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Área com o botão de acesso pelo Google e mensagens de erro. */}
      <div className="mb-4 space-y-2 text-center text-xs text-slate-600 dark:text-slate-300">
        <p>
          Ao escolher entrar com Google, você concorda com os Termos de Uso e declara ciência da
          Política de Privacidade. Serviço destinado a maiores de 18 anos.
        </p>
        <LegalLinks />
      </div>
      <div className="space-y-2.5 mb-4">
        {/* O Google permite escolher a conta e verifica a identidade durante o login. */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-3 px-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-sm transition flex items-center justify-between shadow-md shadow-emerald-950/20 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center p-1 shadow-sm">
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div className="text-left">
              <span className="block text-[10px] uppercase tracking-wider text-emerald-100 font-semibold">
                Autenticar com o Google
              </span>
              <span className="text-xs sm:text-sm font-bold truncate max-w-[190px] block">
                Escolher minha conta
              </span>
            </div>
          </div>

          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <div className="flex items-center gap-1 text-xs font-bold bg-black/20 px-2 py-1 rounded-lg">
              <span>Entrar</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          )}
        </button>
      </div>

      {/* Explica os benefícios de entrar usando a conta Google. */}
      <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 mb-3.5">
        <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Sem senha adicional:</strong> O acesso depende da sua conta Google.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
          <span>
            <strong>1 Clique:</strong> Cadastro e login automáticos.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Acesso individual:</strong> Lançamentos vinculados à sua conta.
          </span>
        </div>
      </div>

      {!isConfigured && (
        <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
          O acesso está temporariamente indisponível. Tente novamente mais tarde.
        </p>
      )}

      {/* Permite experimentar o aplicativo com dados de demonstração. */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={googleLoading}
          className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          Explorar no Modo Convidado (Sem Login)
        </button>
      </div>
    </Modal>
  );
};
