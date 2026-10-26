import { BrandLogo } from './BrandLogo';
import { ToolsMenu } from './ToolsMenu';
import React, { useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calendar,
  Menu,
  X,
  Home,
  Smartphone,
} from 'lucide-react';

interface HeaderProps {
  currentMonth: number; // Janeiro = 0, dezembro = 11; -1 seleciona o ano inteiro.
  currentYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onOpenNewTransaction: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenLanding?: () => void;
  user: { id: string; email: string; isDemo: boolean } | null;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange,
  onOpenNewTransaction,
  onOpenAuth,
  onLogout,
  onOpenLanding,
  user,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Volta um mês e ajusta o ano quando atravessa janeiro.
  const handlePrevMonth = () => {
    if (currentMonth === -1) {
      onMonthChange(new Date().getMonth());
      return;
    }
    if (currentMonth === 0) {
      onMonthChange(11);
      onYearChange(currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1);
    }
  };

  // Avança um mês e ajusta o ano quando atravessa dezembro.
  const handleNextMonth = () => {
    if (currentMonth === -1) {
      onMonthChange(new Date().getMonth());
      return;
    }
    if (currentMonth === 11) {
      onMonthChange(0);
      onYearChange(currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1);
    }
  };

  // Retorna ao mês e ao ano da data atual.
  const handleGoToCurrentMonth = () => {
    const today = new Date();
    onMonthChange(today.getMonth());
    onYearChange(today.getFullYear());
  };

  // Reutiliza o mesmo grupo de ações nos diferentes tamanhos de tela.
  const renderActions = (_isCompact = false) => (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
      <ToolsMenu />
      <PWAInstallButton />

      {/* Botão para alternar a aparência clara e escura. */}
      <ThemeToggle />

      {/* Mostra a conta atual ou oferece o acesso pelo Google. */}
      {user ? (
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 sm:px-2.5 py-1 text-xs flex-shrink-0">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <span
            className="max-w-[70px] sm:max-w-[100px] md:max-w-[120px] truncate text-slate-700 dark:text-slate-300"
            title={user.email}
          >
            {user.email.split('@')[0]}
          </span>
          {user.isDemo && (
            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.5 rounded">
              Demo
            </span>
          )}
          {user.isDemo ? (
            <a
              href="/"
              aria-label="Sair da demonstração"
              title="Sair da demonstração"
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          ) : (
            <button
              onClick={onLogout}
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
              title="Sair da conta"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer flex-shrink-0 shadow-sm"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
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
          <span>Entrar com Google</span>
        </button>
      )}

      {/* Abre o formulário de um novo lançamento. */}
      <button
        onClick={onOpenNewTransaction}
        className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 md:portrait:px-2.5 lg:landscape:px-4 xl:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/40 transition cursor-pointer flex-shrink-0"
        title="Nova Transação"
        aria-label="Nova Transação"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden md:landscape:inline xl:inline portrait:hidden">Nova Transação</span>
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-6 py-2.5 sm:py-3 transition-all w-full text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3 w-full">
        {/* Organiza o logo e os botões no topo da tela. */}
        <div className="flex items-center justify-between w-full xl:w-auto gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Logo e nome do aplicativo. */}
          <BrandLogo onClick={onOpenLanding} />

          {/* Ações exibidas em telas de tamanho intermediário. */}
          <div className="hidden sm:flex xl:hidden items-center">{renderActions(true)}</div>

          {/* Ações compactas para telas pequenas. */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <ThemeToggle />
            <button
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Controles para escolher o período dos lançamentos. */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 sm:p-1.5 self-center w-full sm:w-auto max-w-full overflow-x-auto flex-shrink-0">
          <button
            onClick={handlePrevMonth}
            className="p-1 sm:p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Lista para escolher um mês ou o ano inteiro. */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <select
              aria-label="Mês dos lançamentos"
              value={currentMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer py-1 px-1.5 sm:px-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/60"
            >
              <option
                value={-1}
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                Todo o Ano
              </option>
              {MONTH_NAMES.map((m, idx) => (
                <option
                  key={idx}
                  value={idx}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  {m}
                </option>
              ))}
            </select>

            <select
              aria-label="Ano dos lançamentos"
              value={currentYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer py-1 px-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/60"
            >
              {[
                currentYear - 2,
                currentYear - 1,
                currentYear,
                currentYear + 1,
                currentYear + 2,
              ].map((y) => (
                <option
                  key={y}
                  value={y}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1 sm:p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleGoToCurrentMonth}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-800/10 transition cursor-pointer ml-1 flex-shrink-0"
            title="Ir para o mês atual"
          >
            <Calendar className="w-3 h-3" />
            Hoje
          </button>
        </div>

        {/* Grupo de ações exibido em telas grandes. */}
        <div className="hidden xl:flex items-center">{renderActions(false)}</div>

        {/* Menu que abre ao tocar no botão de três linhas no celular. */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="sm:hidden w-full pt-3 pb-2 border-t border-slate-200 dark:border-slate-800 space-y-3"
          >
            {/* Mostra se a pessoa está na conta real ou na demonstração. */}
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {user.email}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {user.isDemo ? 'Modo Demonstrativo' : 'Conectado via Supabase'}
                      </span>
                    </div>
                  </div>
                  {user.isDemo ? (
                    <a
                      href="/"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40"
                    >
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                      Sair da demonstração
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition cursor-pointer flex-shrink-0"
                      title="Sair da conta"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Sessão Demonstrativa
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Acesse com Google para sincronizar
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-sm transition cursor-pointer flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
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
                    <span>Entrar</span>
                  </button>
                </div>
              )}
            </div>

            <ToolsMenu inline onNavigate={() => setIsMobileMenuOpen(false)} />
            {/* Atalhos de navegação e instalação do aplicativo. */}
            <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
              {onOpenLanding && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenLanding();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    Página de Apresentação
                  </span>
                  <span className="text-[11px] text-slate-600">Ver</span>
                </button>
              )}

              <div className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 transition">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  Instalar Aplicativo (PWA)
                </span>
                <PWAInstallButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
