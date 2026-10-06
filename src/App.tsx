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
  RefreshCw, 
  LayoutDashboard, 
  ListOrdered, 
  PieChart, 
  Home
} from 'lucide-react';

export default function App() {
  // useState guarda valores da tela; chamar o setter faz o React atualizar a interface.
  const currentDate = new Date();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear());

  type AppUser = { id: string; email: string; isDemo: boolean };
  const [user, setUser] = useState<AppUser | null>(null);
  // useRef guarda controles entre atualizações da tela, sem redesenhá-la.
  // A versão da busca impede que uma resposta antiga sobrescreva os dados atuais.
  const activeUser = useRef<AppUser | null>(null);
  const requestVersion = useRef(0);


  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Controla quais janelas estão abertas e qual lançamento será editado.
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // No celular, mostra apenas a seção escolhida na navegação inferior.
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'charts'>('dashboard');

  // Guarda as escolhas usadas para selecionar os lançamentos exibidos.
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
  const invalidateRequest = useCallback(() => { requestVersion.current++; }, []);

  // Ao trocar de conta, limpa os dados anteriores antes de carregar os da nova pessoa.
  const applyUser = useCallback((nextUser: AppUser | null) => {
    requestVersion.current++;
    activeUser.current = nextUser;
    setTransactions([]);
    setTransactionToEdit(null);
    setIsTransactionModalOpen(false);
    setUser(nextUser);
    setLoading(true);
    setLoadError('');
    if (nextUser) {
      setCurrentView(nextUser.isDemo ? 'landing' : 'dashboard');
    }
  }, []);

  // Busca os lançamentos do período; async/await permite aguardar a resposta do serviço.
  const loadTransactions = useCallback(async () => {
    if (!user || activeUser.current !== user) return;
    // Só a busca mais recente poderá atualizar a tela, mesmo se as respostas chegarem fora de ordem.
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchTransactionsService(user.id, user.isDemo, { month: currentMonth, year: currentYear });
      if (version === requestVersion.current) setTransactions(data);
    } catch {
      if (version === requestVersion.current) {
        setLoadError('Não foi possível carregar os lançamentos. Os valores exibidos podem estar desatualizados. Tente novamente.');
      }
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [user, currentMonth, currentYear]);

  useEffect(() => {
    // useEffect repete a busca quando mudam a conta ou o período selecionado.
    void loadTransactions();
    return invalidateRequest;
  }, [loadTransactions, invalidateRequest]);

  useEffect(() => {
    // Recupera o acesso à conta e acompanha login/logout; sem sessão, oferece a demonstração.
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
      // Descarta buscas anteriores assim que a sessão muda.
      applyUser(null);
      if (!session?.user) {
        applyUser(guestUser);
        return;
      }
      // Aguarda o aviso de autenticação terminar antes de confirmar a conta no servidor.
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
      invalidateRequest();
      subscription.unsubscribe();
    };
  }, [client, applyUser, invalidateRequest]);

  // Se sair da conta falhar, restaura o usuário anterior e mostra uma mensagem.
  const handleLogout = async () => {
    const previousUser = activeUser.current;
    applyUser(null);
    if (client) {
      const { error } = await client.auth.signOut();
      if (error) {
        applyUser(previousUser);
        setLoadError('Não foi possível sair da conta. Tente novamente.');
        return;
      }
    }
    applyUser({ id: 'demo-user-id', email: 'demo@exemplo.com', isDemo: true });
  };

  // Cria, edita e exclui lançamentos; depois busca os dados para atualizar a tela.
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

  // useMemo reaproveita a lista filtrada até os dados ou os filtros mudarem.
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Descarta lançamentos fora do ano e, quando selecionado, do mês.
      if (t.data) {
        const [yStr, mStr] = t.data.split('-');
        const txYear = parseInt(yStr, 10);
        const txMonth = parseInt(mStr, 10) - 1; // No JavaScript, janeiro é 0 e dezembro é 11.

        if (txYear !== currentYear) return false;
        if (currentMonth !== -1 && txMonth !== currentMonth) return false;
      }

      // Procura o texto na descrição, na categoria e na forma de pagamento.
      if (filterState.searchTerm.trim()) {
        const term = filterState.searchTerm.toLowerCase();
        const matchDesc = t.descricao.toLowerCase().includes(term);
        const matchCat = t.categoria.toLowerCase().includes(term);
        const matchPm = t.forma_pagamento.toLowerCase().includes(term);
        if (!matchDesc && !matchCat && !matchPm) return false;
      }

      // Mantém receitas, despesas ou ambas, conforme a escolha.
      if (filterState.type !== 'todos' && t.tipo !== filterState.type) {
        return false;
      }

      // Mantém lançamentos pagos, pendentes ou ambos.
      if (filterState.status !== 'todos' && t.status !== filterState.status) {
        return false;
      }

      return true;
    });
  }, [transactions, currentMonth, currentYear, filterState]);

  // Soma apenas os lançamentos filtrados, separando valores pagos dos pendentes.
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

    // O saldo considera o dinheiro já recebido e gasto; pendências ficam no resumo separado.
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

  // Aguarda a confirmação da sessão antes de escolher a tela inicial.
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center" role="status" aria-live="polite">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-500" aria-hidden="true" />
        <span>Carregando sua sessão...</span>
      </div>
    );
  }

  // Visitantes veem a apresentação; quem entrou na conta segue para o painel.
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
      {/* Cabeçalho com período selecionado e ações da conta. */}
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

      {/* Área principal com os dados financeiros e avisos de carregamento. */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
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
        {!loading && !loadError && <SummaryCards stats={stats} />}

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

        {/* Etapa 5: Dashboard Visual com Chart.js */}
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
          {!loading && !loadError && <FinancialCharts transactions={filteredTransactions} />}
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
              categoria: filterState.categoria,
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

      {/* Botão fixo para criar um lançamento no celular. */}
      <button
        onClick={() => {
          setTransactionToEdit(null);
          setIsTransactionModalOpen(true);
        }}
        className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 active:scale-90 text-white flex items-center justify-center shadow-2xl shadow-emerald-950/20 dark:shadow-emerald-950 border border-emerald-400/40 cursor-pointer"
        aria-label="Nova Transação"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Rodapé com informações do aplicativo. */}
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

      {/* Aviso de falta de conexão informado pelo navegador. */}
      <OfflineIndicator />
    </div>
  );
}
