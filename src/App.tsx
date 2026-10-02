import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Transaction, SummaryStats, FilterState, TransactionStatus } from './types/finance';
import {
  fetchTransactionsService,
  addTransactionService,
  updateTransactionService,
  deleteTransactionService,
  toggleStatusService,
  getSupabaseClient,
} from './services/supabase';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { FinancialCharts } from './components/FinancialCharts';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LandingPage } from './components/LandingPage';
import { 
  Plus, 
  Database, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  LayoutDashboard, 
  ListOrdered, 
  PieChart, 
  SlidersHorizontal,
  Home
} from 'lucide-react';

export default function App() {
  const currentDate = new Date();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear());

  type AppUser = { id: string; email: string; isDemo: boolean };
  const [user, setUser] = useState<AppUser | null>(null);
  const activeUser = useRef<AppUser | null>(null);
  const requestVersion = useRef(0);
  const [configurationVersion, refreshConfiguration] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active view tab for mobile convenience
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'charts'>('dashboard');

  // Filters
  const [filterState, setFilterState] = useState<FilterState>({
    month: currentMonth,
    year: currentYear,
    type: 'todos',
    status: 'todos',
    categoria: 'todas',
    formaPagamento: 'todas',
    searchTerm: '',
  });

  const client = getSupabaseClient();

  const applyUser = useCallback((nextUser: AppUser | null) => {
    requestVersion.current++;
    activeUser.current = nextUser;
    setTransactions([]);
    setTransactionToEdit(null);
    setIsTransactionModalOpen(false);
    setUser(nextUser);
    if (nextUser) {
      setCurrentView(nextUser.isDemo ? 'landing' : 'dashboard');
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    if (!user || activeUser.current !== user) return;
    const version = ++requestVersion.current;
    try {
      const data = await fetchTransactionsService(user.id, user.isDemo);
      if (version === requestVersion.current) setTransactions(data);
    } catch (err) {
      if (version === requestVersion.current) {
        setTransactions([]);
        console.error('Falha ao carregar transações:', err);
      }
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [user]);

  useEffect(() => {
    void loadTransactions();
    return () => { requestVersion.current++; };
  }, [loadTransactions]);

  useEffect(() => {
    const guestUser: AppUser = { id: 'demo-user-id', email: 'demo@exemplo.com', isDemo: true };
    let disposed = false;
    let authVersion = 0;
    if (!client) {
      applyUser(guestUser);
      return;
    }
    applyUser(null);
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (disposed) return;
      const version = ++authVersion;
      // Invalidate pending responses as soon as the auth event arrives.
      applyUser(null);
      if (!session?.user) {
        applyUser(guestUser);
        return;
      }
      // Run outside the auth callback lock, and validate identity with the server.
      setTimeout(() => {
        if (disposed || version !== authVersion) return;
        void client.auth.getUser().then(({ data, error }) => {
          if (disposed || version !== authVersion) return;
          if (error || !data.user) {
            applyUser(guestUser);
            return;
          }
          applyUser({ id: data.user.id, email: data.user.email || '', isDemo: false });
          setIsAuthModalOpen(false);
        }).catch(() => {
          if (!disposed && version === authVersion) applyUser(guestUser);
        });
      }, 0);
    });
    return () => {
      disposed = true;
      authVersion++;
      requestVersion.current++;
      subscription.unsubscribe();
    };
  }, [client, applyUser, configurationVersion]);

  const handleLogout = async () => {
    const previousUser = activeUser.current;
    applyUser(null);
    if (client) {
      const { error } = await client.auth.signOut();
      if (error) {
        applyUser(previousUser);
        console.error('Não foi possível encerrar a sessão:', error);
        return;
      }
    }
    applyUser({ id: 'demo-user-id', email: 'demo@exemplo.com', isDemo: true });
  };

  // CRUD Handlers
  const handleSaveTransaction = async (
    data: Omit<Transaction, 'id' | 'created_at'>,
    id?: string
  ) => {
    if (!user) throw new Error('Aguarde a validação da sessão.');
    const isDemo = user.isDemo;
    const userId = user.id;

    if (id) {
      await updateTransactionService(id, { ...data, user_id: userId }, isDemo);
    } else {
      await addTransactionService({ ...data, user_id: userId }, isDemo);
    }
    await loadTransactions();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) throw new Error('Aguarde a validação da sessão.');
    const isDemo = user.isDemo;
    await deleteTransactionService(id, isDemo);
    await loadTransactions();
  };

  const handleToggleStatus = async (id: string, currentStatus: TransactionStatus) => {
    if (!user) throw new Error('Aguarde a validação da sessão.');
    const isDemo = user.isDemo;
    await toggleStatusService(id, currentStatus, isDemo);
    await loadTransactions();
  };

  // Filtered transactions based on month, year, search, type, and status
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Month and Year filter
      if (t.data) {
        const [yStr, mStr] = t.data.split('-');
        const txYear = parseInt(yStr, 10);
        const txMonth = parseInt(mStr, 10) - 1; // 0-indexed

        if (txYear !== currentYear) return false;
        if (currentMonth !== -1 && txMonth !== currentMonth) return false;
      }

      // Search term
      if (filterState.searchTerm.trim()) {
        const term = filterState.searchTerm.toLowerCase();
        const matchDesc = t.descricao.toLowerCase().includes(term);
        const matchCat = t.categoria.toLowerCase().includes(term);
        const matchPm = t.forma_pagamento.toLowerCase().includes(term);
        if (!matchDesc && !matchCat && !matchPm) return false;
      }

      // Type filter
      if (filterState.type !== 'todos' && t.tipo !== filterState.type) {
        return false;
      }

      // Status filter
      if (filterState.status !== 'todos' && t.status !== filterState.status) {
        return false;
      }

      return true;
    });
  }, [transactions, currentMonth, currentYear, filterState]);

  // Compute summary metrics (Etapa 4.2)
  const stats: SummaryStats = useMemo(() => {
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalPendentesReceber = 0;
    let totalPendentesPagar = 0;

    filteredTransactions.forEach((t) => {
      if (t.tipo === 'receita') {
        if (t.status === 'pago') {
          totalEntradas += t.valor;
        } else {
          totalPendentesReceber += t.valor;
        }
      } else if (t.tipo === 'despesa') {
        if (t.status === 'pago') {
          totalSaidas += t.valor;
        } else {
          totalPendentesPagar += t.valor;
        }
      }
    });

    const saldoAtual = totalEntradas - totalSaidas;
    const taxaEconomia =
      totalEntradas > 0 && saldoAtual > 0 ? (saldoAtual / totalEntradas) * 100 : 0;

    return {
      totalEntradas,
      totalSaidas,
      saldoAtual,
      totalPendentesReceber,
      totalPendentesPagar,
      taxaEconomia,
      quantidadeTransacoes: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTransactions();
  };

  // Wait for session recovery before choosing the visitor or authenticated view.
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center" role="status" aria-live="polite">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-500" aria-hidden="true" />
        <span>Carregando sua sessão...</span>
      </div>
    );
  }

  // Authenticated users always see their dashboard, including after OAuth or reload.
  if (currentView === 'landing' && user.isDemo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        <LandingPage
          onOpenLogin={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenRegister={() => {
            setAuthModalMode('register');
            setIsAuthModalOpen(true);
          }}
          onGoToDashboard={() => {
            setCurrentView('dashboard');
          }}
          onLogout={handleLogout}
          isLoggedIn={Boolean(user && !user.isDemo)}
          userEmail={user?.email}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(authUser) => {
            applyUser(authUser);
            setCurrentView('dashboard');
          }}
          initialMode={authModalMode}
        />

        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Header
        currentMonth={currentMonth}
        currentYear={currentYear}
        onMonthChange={(m) => {
          setCurrentMonth(m);
          setFilterState((prev) => ({ ...prev, month: m }));
        }}
        onYearChange={(y) => {
          setCurrentYear(y);
          setFilterState((prev) => ({ ...prev, year: y }));
        }}
        onOpenNewTransaction={() => {
          setTransactionToEdit(null);
          setIsTransactionModalOpen(true);
        }}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenLanding={user.isDemo ? () => {
          setCurrentView('landing');
        } : undefined}
        user={user}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
        {/* Refresh bar & Subheader status */}
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
            {user.isDemo && <button
              onClick={() => setCurrentView('landing')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs transition cursor-pointer shadow-sm"
              title="Voltar para a página de apresentação"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Ver Apresentação</span>
            </button>}
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

        {/* Etapa 4: Cards de Resumo Financeiro */}
        <SummaryCards stats={stats} />

        {/* View Switcher for Mobile Tabs */}
        <div className="flex sm:hidden border border-slate-200 dark:border-slate-800 bg-slate-200/80 dark:bg-slate-900 rounded-xl p-1 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'transactions' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Transações
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'charts' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Gráficos
          </button>
        </div>

        {/* Etapa 5: Dashboard Visual com Chart.js */}
        <div className={activeTab === 'transactions' ? 'hidden sm:block' : 'block'}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Gráficos Interativos (Chart.js)
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Categorias, Métodos de Pagamento e Fluxo
            </span>
          </div>
          <FinancialCharts transactions={filteredTransactions} />
        </div>

        {/* Etapa 3: Gestão de Transações (CRUD, Filtros, Busca) */}
        <div className={activeTab === 'charts' ? 'hidden sm:block' : 'block'}>
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
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Nova Transação
            </button>
          </div>

          <TransactionList
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
              categoria: filterState.categoria,
              searchTerm: filterState.searchTerm,
            }}
            onFilterChange={(updates) => setFilterState((prev) => ({ ...prev, ...updates }))}
            onOpenNewModal={() => {
              setTransactionToEdit(null);
              setIsTransactionModalOpen(true);
            }}
          />
        </div>
      </main>

      {/* Floating Action Button (Mobile-First Polish) */}
      <button
        onClick={() => {
          setTransactionToEdit(null);
          setIsTransactionModalOpen(true);
        }}
        className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white flex items-center justify-center shadow-2xl shadow-emerald-950/20 dark:shadow-emerald-950 border border-emerald-400/40 cursor-pointer"
        aria-label="Nova Transação"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>ContandoDinheiro — Sistema de Gestão Financeira com Supabase & PWA</p>
        </div>
      </footer>

      {/* Modals */}
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
        onAuthSuccess={(authUser) => {
          applyUser(authUser);
          setCurrentView('dashboard');
        }}
        initialMode={authModalMode}
      />

      {/* Offline PWA Status Badge */}
      <OfflineIndicator />
    </div>
  );
}
