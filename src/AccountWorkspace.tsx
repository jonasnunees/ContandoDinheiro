import { localDate } from './features/finance/validation';
import { DueDates } from './features/finance/components/DueDates';
import { DemoGuide } from './features/finance/components/DemoGuide';
import React, { lazy, Suspense, useState, useMemo, useSyncExternalStore, useEffect, useRef } from 'react';
import type { Transaction, FilterState } from './features/finance/types';
import type { AppUser } from './features/auth/session';
import { useTransactions } from './features/finance/useTransactions';
import { filterTransactions, summarizeTransactions } from './features/finance/calculations';
import { Header } from './components/Header';
import { SummaryCards } from './features/finance/components/SummaryCards';
import { TransactionList } from './features/finance/components/TransactionList';
import { TransactionModal } from './features/finance/components/TransactionModal';
import { AuthModal } from './features/auth/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { 
  Plus, 
  ArrowUp,
  RefreshCw, 
  LayoutDashboard, 
  ListOrdered, 
  PieChart, 
  Home,
  Github
} from 'lucide-react';

// Os gráficos e o histórico de versões só são baixados quando essas telas são usadas.
const FinancialCharts = lazy(() => import('./features/finance/components/FinancialCharts').then(module => ({ default: module.FinancialCharts })));

function subscribeToScroll(callback: () => void) {
  window.addEventListener('scroll', callback, { passive: true });
  window.addEventListener('resize', callback);
  return () => {
    window.removeEventListener('scroll', callback);
    window.removeEventListener('resize', callback);
  };
}

function hasScrolledPastFirstScreen() {
  return window.scrollY >= window.innerHeight;
}

export default function AccountWorkspace({ user, sessionError, onLogout }: { user: AppUser; sessionError: string; onLogout: () => Promise<void> }) {
  const showBackToTop = useSyncExternalStore(subscribeToScroll, hasScrolledPastFirstScreen, () => false);
  const currentDate = new Date();
  const footerRef = useRef<HTMLElement>(null);
  const scrollAnimation = useRef<number | null>(null);
  const [footerClearance, setFooterClearance] = useState(0);
  const isFooterVisible = footerClearance > 0;
  const floatingButtonStyle = {
    bottom: `max(calc(1.5rem + env(safe-area-inset-bottom)), ${footerClearance}px)`,
  };

  useEffect(() => {
    const cancelScroll = () => {
      if (scrollAnimation.current !== null) cancelAnimationFrame(scrollAnimation.current);
      scrollAnimation.current = null;
    };
    window.addEventListener('wheel', cancelScroll, { passive: true });
    window.addEventListener('touchstart', cancelScroll, { passive: true });
    window.addEventListener('keydown', cancelScroll);
    return () => {
      cancelScroll();
      window.removeEventListener('wheel', cancelScroll);
      window.removeEventListener('touchstart', cancelScroll);
      window.removeEventListener('keydown', cancelScroll);
    };
  }, []);

  const scrollBackToTop = () => {
    document.getElementById('dashboard-content')?.focus({ preventScroll: true });
    if (scrollAnimation.current !== null) cancelAnimationFrame(scrollAnimation.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scrollAnimation.current = null;
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const startY = window.scrollY;
    const duration = Math.min(1800, 1200 + startY * 0.15);
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // Curva cosseno: começa devagar e freia gradualmente ao chegar ao topo.
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      window.scrollTo({ top: startY * (1 - eased), behavior: 'instant' });
      scrollAnimation.current = progress < 1 ? requestAnimationFrame(animate) : null;
    };
    scrollAnimation.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const updatePosition = () => {
      const top = footer.getBoundingClientRect().top;
      setFooterClearance(top < window.innerHeight ? window.innerHeight - top + 16 : 0);
    };
    const observer = new ResizeObserver(updatePosition);
    observer.observe(document.body);
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    updatePosition();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear());

  const { transactions, pendingTransactions, loading, loadError, isRefreshing,
    saveTransaction: handleSaveTransaction, deleteTransaction: handleDeleteTransaction,
    toggleStatus: handleToggleStatus, refresh: handleRefresh } = useTransactions(user, currentMonth, currentYear);

  // Controla quais janelas estão abertas e qual lançamento será editado.
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // No celular, mostra apenas a seção escolhida na navegação inferior.
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'charts'>('dashboard');

  // Guarda as escolhas usadas para selecionar os lançamentos exibidos.
  const [filterState, setFilterState] = useState<FilterState>({ type: 'todos', status: 'todos', searchTerm: '' });
  // Lista, cartões, gráficos e exportação usam o mesmo recorte de dados.
  // useMemo reaproveita os cálculos enquanto a lista, o período e os filtros não mudarem.
  const filteredTransactions = useMemo(() => filterTransactions(transactions,
    { month: currentMonth, year: currentYear }, filterState), [transactions, currentMonth, currentYear, filterState]);
  const stats = useMemo(() => summarizeTransactions(filteredTransactions), [filteredTransactions]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Cabeçalho com período selecionado e ações da conta. */}
      <Header
        currentMonth={currentMonth}
        currentYear={currentYear}
        onMonthChange={(m) => {
          setCurrentMonth(m);
        }}
        onYearChange={(y) => {
          setCurrentYear(y);
        }}
        onOpenNewTransaction={() => {
          setTransactionToEdit(null);
          setIsTransactionModalOpen(true);
        }}
        onOpenAuth={() => {
          setIsAuthModalOpen(true);
        }}
        onLogout={onLogout}
        onOpenLanding={user.isDemo ? () => {
          window.location.assign('/');
        } : undefined}
        user={user}
      />

      {/* Área principal com os dados financeiros e avisos de carregamento. */}
      <main id="dashboard-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
        {sessionError && <p role="alert" className="rounded-xl border border-rose-400 p-4 text-rose-700 dark:text-rose-300">{sessionError}</p>}
        {loadError && <div role="alert" className="rounded-xl border border-rose-400 p-4 text-rose-700 dark:text-rose-300">
          <p>{loadError}</p><button type="button" onClick={handleRefresh} disabled={loading} className="mt-2 underline">Tentar novamente</button>
        </div>}
        {loading && <p role="status">Carregando lançamentos...</p>}
        {/* Mostra o período exibido e permite buscar os dados novamente. */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Exibindo dados de{' '}
              <strong className="text-slate-900 dark:text-slate-200">
                {currentMonth === -1
                  ? `Todo o Ano de ${currentYear}`
                  : `${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(currentYear, currentMonth))} de ${currentYear}`}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {user.isDemo && <a
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs transition cursor-pointer shadow-sm"
              title="Voltar para a página de apresentação"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Ver Apresentação</span>
            </a>}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Recarregar lançamentos"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>
        </div>

        {user.isDemo && !loading && !loadError && <DemoGuide onExplore={(search, monthOffset = 0) => {
          const date = new Date();
          date.setDate(1);
          date.setMonth(date.getMonth() + monthOffset);
          setCurrentMonth(date.getMonth());
          setCurrentYear(date.getFullYear());
          setFilterState({ type: 'todos', status: 'todos', searchTerm: search });
          setActiveTab('transactions');
          requestAnimationFrame(() => document.getElementById('transactions-section')?.focus());
        }} />}

        {/* Totais do recorte atual; ocultos durante carregamento ou erro de leitura. */}
        {!loading && !loadError && <SummaryCards stats={stats} />}

        {!loading && !loadError && <DueDates transactions={pendingTransactions} onPay={tx => {
          setTransactionToEdit({ ...tx, status: 'pago', data_pagamento: localDate() });
          setIsTransactionModalOpen(true);
        }} />}

        {/* Botões que escolhem a seção exibida no celular. */}
        <div className="flex sm:hidden border border-slate-200 dark:border-slate-800 bg-slate-200/80 dark:bg-slate-900 rounded-xl p-1 gap-1 text-xs font-semibold">
          <button
            aria-pressed={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'dashboard' ? 'bg-emerald-700 text-white shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Visão Geral
          </button>
          <button
            aria-pressed={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'transactions' ? 'bg-emerald-700 text-white shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Transações
          </button>
          <button
            aria-pressed={activeTab === 'charts'} onClick={() => setActiveTab('charts')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'charts' ? 'bg-emerald-700 text-white shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Gráficos
          </button>
        </div>

        {/* Gráficos do mesmo recorte da lista; a aba controla a visibilidade no celular. */}
        <div className={activeTab === 'transactions' ? 'hidden sm:block' : 'block'}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Gráficos financeiros
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Categorias, Métodos de Pagamento e Fluxo
            </span>
          </div>
          {!loading && !loadError && <Suspense fallback={<p role="status" className="min-h-96 p-6">Carregando gráficos...</p>}><FinancialCharts transactions={filteredTransactions} /></Suspense>}
        </div>

        {/* Lista de lançamentos com busca, filtros e ações de criação, edição e exclusão. */}
        <div id="transactions-section" tabIndex={-1} className={activeTab === 'charts' ? 'hidden sm:block' : 'block'}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Lançamentos & Extrato
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-mono">
                {filteredTransactions.length}
              </span>
            </h2>
            <button
              onClick={() => {
                setTransactionToEdit(null);
                setIsTransactionModalOpen(true);
              }}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Nova Transação
            </button>
          </div>

          {!loading && !loadError && <TransactionList
            transactions={filteredTransactions}
            onEdit={(tx) => {
              setTransactionToEdit(tx);
              setIsTransactionModalOpen(true);
            }}
            onDelete={handleDeleteTransaction}
            onToggleStatus={handleToggleStatus}
            filterState={{
              type: filterState.type,
              status: filterState.status,
              searchTerm: filterState.searchTerm,
            }}
            onFilterChange={(updates) => setFilterState((prev) => ({ ...prev, ...updates }))}
            onOpenNewModal={() => {
              setTransactionToEdit(null);
              setIsTransactionModalOpen(true);
            }}
          />}
        </div>
      </main>

      {/* Atalhos fixos para voltar ao topo e criar um lançamento no celular. */}
      <button
        type="button"
        onClick={scrollBackToTop}
        inert={!showBackToTop}
        aria-hidden={!showBackToTop}
        tabIndex={showBackToTop ? 0 : -1}
        style={floatingButtonStyle}
        className={`md:hidden fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-30 w-14 h-14 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-500 dark:border-slate-400 shadow-lg flex items-center justify-center cursor-pointer transition-[opacity,translate,visibility,bottom] duration-300 ease-in-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 ${isFooterVisible ? '-translate-x-18 translate-y-0' : 'translate-x-0 -translate-y-18'} ${showBackToTop ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'}`}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <ArrowUp className="w-6 h-6" aria-hidden="true" />
      </button>
      <button
        style={floatingButtonStyle}
        onClick={() => {
          setTransactionToEdit(null);
          setIsTransactionModalOpen(true);
        }}
        className="md:hidden fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-30 w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 active:scale-90 text-white flex items-center justify-center shadow-2xl shadow-emerald-950/20 dark:shadow-emerald-950 border border-emerald-400/40 cursor-pointer transition-[bottom] duration-300 ease-in-out motion-reduce:transition-none"
        aria-label="Nova Transação"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Rodapé com informações do aplicativo. */}
      <footer ref={footerRef} className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-6 px-4 text-center text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-xs">
              C
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-300">ContandoDinheiro</span>
            <span>— Gestão Financeira Pessoal Gratuita</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="#notas-da-versao" className="rounded text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400">Notas da versão</a>
          <a
            href="https://github.com/jonasnunees/ContandoDinheiro"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
            aria-label="Projeto no GitHub (abre em uma nova aba)"
          >
            <Github className="w-4 h-4 shrink-0" aria-hidden="true" />
            Projeto no GitHub
          </a>
          </div>
        </div>
      </footer>

      {/* Janelas de lançamento e acesso; fechar a edição também limpa o item selecionado. */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSave={handleSaveTransaction}
        transactionToEdit={transactionToEdit}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {
          window.location.assign('/demo');
        }}
      />

      {/* Aviso de falta de conexão informado pelo navegador. */}
      <OfflineIndicator />
    </div>
  );
}
