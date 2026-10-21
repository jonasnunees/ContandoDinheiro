import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  PieChart, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Wallet,
  Menu,
  X,
  LogOut,
  Repeat2, CreditCard, CalendarDays, Github
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onLogout?: () => void;
  isLoggedIn: boolean;
  userEmail?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenRegister,
  onLogout,
  isLoggedIn,
  userEmail,
}) => {
  // Esta página apresenta o produto; os comandos recebidos abrem login, cadastro ou demonstração.
  // O estado abaixo controla a abertura do menu em telas pequenas.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Barra superior com logo, tema e botões de acesso. */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Identidade visual e nome do aplicativo. */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/20 p-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                ContandoDinheiro
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                100% Gratuito
              </span>
            </div>
          </div>

          {/* Botões de acesso exibidos em telas maiores. */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <PWAInstallButton />

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    {(userEmail || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[150px] truncate">
                    {userEmail || 'Usuário'}
                  </span>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-0.5 ml-1 transition cursor-pointer"
                      title="Desconectar"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <a
                  href="/demo"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-xs font-bold text-white shadow-md shadow-emerald-950/20 transition cursor-pointer"
                >
                  <span>Painel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 shadow-sm transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Entrar com Google</span>
              </button>
            )}
          </div>

          {/* No celular, reúne a troca de tema e o botão que abre o menu. */}
          <div className="flex sm:hidden items-center gap-1.5">
            <ThemeToggle />
            <button
              aria-expanded={isMobileMenuOpen} aria-controls="landing-mobile-menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              title="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Exibe as opções do menu quando ele está aberto no celular. */}
        {isMobileMenuOpen && (
          <div id="landing-mobile-menu" className="sm:hidden max-w-7xl mx-auto pt-3 pb-2 mt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {isLoggedIn ? (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {(userEmail || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400">Logado</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{userEmail || 'Sessão ativa'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      title="Sair"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                  <a
                    href="/demo"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition cursor-pointer"
                  >
                    <span>Painel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Acessar com a Conta Google</span>
              </button>
            )}

            {/* Atalhos adicionais dentro do menu do celular. */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <a
                href="/demo"
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition cursor-pointer text-left"
              >
                <span>Acessar Painel / Demonstração</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  Instalar Aplicativo (PWA)
                </span>
                <PWAInstallButton />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Apresentação inicial com a proposta do aplicativo e botões de acesso. */}
      <main>
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-900">
        {/* Efeitos decorativos de iluminação no fundo. */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          {/* Selo que destaca uma característica do aplicativo. */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema 100% Gratuito • Login com a Conta Google sem precisar de senha</span>
          </div>

          {/* Título principal da apresentação. */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Controle suas finanças de forma simples e{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-500">
              fique sempre no azul.
            </span>
          </h1>

          {/* Texto que explica a proposta do aplicativo. */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Organize receitas, despesas, contas mensais e compras parceladas. Acompanhe o que já foi pago e planeje os próximos meses em um só lugar.
          </p>

          {/* Botões para entrar, cadastrar-se ou experimentar a demonstração. */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 shadow-xl shadow-slate-900/5 flex items-center justify-center gap-3 transition cursor-pointer active:scale-95"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Acessar com a Conta Google (Sem Senha)</span>
            </button>

            <a
              href="/demo"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Explorar demonstração sem login →
            </a>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">A demonstração inclui contas recorrentes, compras parceladas e compromissos dos próximos meses para você experimentar.</p>

          {/* Informações curtas sobre o acesso e o uso do aplicativo. */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Login com Google em 1 clique</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Sem necessidade de criar senha</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Dados protegidos via Supabase</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Instalável no Celular e PC (PWA)</span>
            </div>
          </div>
        </div>

        {/* Prévia ilustrativa do painel, com valores fixos de exemplo. */}
        <div className="max-w-5xl mx-auto mt-12 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400">Prévia do painel</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Dados fictícios
            </span>
          </div>

          {/* Cartões de exemplo que mostram como os totais aparecerão no painel. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="card-lift rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Receitas do Mês</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">R$ 8.135,50</div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> Recebido no período
              </span>
            </div>

            <div className="card-lift rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase">Despesas do Mês</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">R$ 3.820,00</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Alimentação, Moradia, Transporte</span>
            </div>

            <div className="card-lift rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">Saldo Positivo</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">R$ 4.315,50</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">53% de economia poupada</span>
            </div>
          </div>

          {/* Lista ilustrativa com lançamentos de exemplo. */}
          <div className="rounded-xl bg-slate-100/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-2">
              <span>ÚLTIMOS LANÇAMENTOS</span>
              <span>VALOR</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800 dark:text-white">Salário Mensal</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">Salário</span>
              </div>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">+ R$ 6.500,00</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-semibold text-slate-800 dark:text-white">Aluguel & Condomínio</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">Moradia</span>
              </div>
              <span className="font-bold text-rose-700 dark:text-rose-400">- R$ 1.850,00</span>
            </div>
          </div>
        </div>
      </section>

      {/* Apresenta os recursos disponíveis no aplicativo. */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Tudo o que você precisa, sem complicação
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Do registro do dia a dia ao planejamento dos próximos meses, acompanhe seu dinheiro com clareza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Explica o primeiro benefício. */}
          <div className="card-lift rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Receitas e despesas organizadas</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Adicione receitas e despesas com categoria, forma de pagamento (Pix, cartão, boleto) e alterne status entre pago e pendente com 1 clique.
            </p>
          </div>

          <div className="card-lift rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Repeat2 aria-hidden="true" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contas mensais sem retrabalho</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Cadastre receitas e despesas recorrentes, com ou sem término. Ao editar, escolha uma ocorrência ou as próximas pendências, preservando o que já foi pago ou recebido.</p>
          </div>

          <div className="card-lift rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard aria-hidden="true" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compras parceladas sob controle</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Informe o valor total e a quantidade de parcelas. Acompanhe cada lançamento com sua identificação, como “3 de 10”, e veja o que ainda falta pagar.</p>
          </div>

          <div className="card-lift rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays aria-hidden="true" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Próximos meses à vista</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Consulte receitas a receber e despesas pendentes dos próximos meses. O saldo realizado considera apenas os pagamentos e recebimentos confirmados.</p>
          </div>

          {/* Explica o segundo benefício. */}
          <div className="card-lift rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gráficos, filtros e exportação</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Compare entradas e saídas, consulte gráficos ou tabelas e encontre lançamentos com os filtros. Exporte o extrato em CSV para abrir em uma planilha.
            </p>
          </div>

          {/* Explica o terceiro benefício. */}
          <div className="card-lift rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No celular e no computador</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Use os temas claro e escuro e instale o aplicativo em navegadores compatíveis. Os dados da sua conta precisam de internet; a demonstração pode reabrir offline após o navegador salvar os arquivos necessários.
            </p>
          </div>
        </div>
      </section>

      {/* Explica os três passos para começar a usar o aplicativo. */}
      <section className="py-12 px-4 sm:px-8 bg-slate-100/60 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Passo a Passo Simples
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Como começar a organizar seu dinheiro
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="card-lift p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm">
                1
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Experimente sem login</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Abra a demonstração com exemplos fictícios. Suas alterações ficam somente neste navegador, separadas dos dados da sua conta.
              </p>
            </div>

            <div className="card-lift p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm">
                2
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Entre na sua conta</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use sua conta Google ou cadastre seu e-mail e senha para salvar seus próprios lançamentos e acessá-los em outro dispositivo.
              </p>
            </div>

            <div className="card-lift p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm">
                3
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Registre e planeje</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adicione receitas, despesas, recorrências e parcelas. Confirme pagamentos e recebimentos para atualizar seu saldo realizado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Convite final para acessar o aplicativo. */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-100 dark:from-emerald-950/80 dark:via-slate-900 dark:to-teal-950/80 border border-emerald-300 dark:border-emerald-500/40 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            100% Gratuito Para Sempre
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Pronto para colocar suas finanças em ordem?
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Comece pelos exemplos da demonstração ou entre na sua conta para organizar seus próprios lançamentos, contas recorrentes e compras parceladas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 shadow-xl flex items-center justify-center gap-3 transition cursor-pointer active:scale-95"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Acessar com o Google (Sem Senha)</span>
            </button>

            <a
              href="/demo"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Testar demonstração sem login →
            </a>
          </div>
        </div>
      </section>

      </main>
      {/* Rodapé com informações do aplicativo. */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-8 px-4 sm:px-8 text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-xs">
              C
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-300">ContandoDinheiro</span>
            <span>— Gestão Financeira Pessoal Gratuita</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
            <a href="#notas-da-versao" className="rounded hover:text-emerald-700 dark:hover:text-emerald-400">Notas da versão</a>
            <a
              href="https://github.com/jonasnunees/ContandoDinheiro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded hover:text-emerald-600 dark:hover:text-emerald-400 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
              aria-label="Projeto no GitHub (abre em uma nova aba)"
            >
              <Github className="w-4 h-4 shrink-0" aria-hidden="true" />
              Projeto no GitHub
            </a>
            <span aria-hidden="true">•</span>
            <button
              onClick={onOpenLogin}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              Login
            </button>
            <span>•</span>
            <button
              onClick={onOpenRegister}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              Cadastro
            </button>
            <span>•</span>
            <a
              href="/demo"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              Acessar Painel
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
