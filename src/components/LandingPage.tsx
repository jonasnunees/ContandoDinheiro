import React from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  PieChart, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  LogIn, 
  UserPlus,
  Wallet
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onGoToDashboard: () => void;
  isLoggedIn: boolean;
  userEmail?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenRegister,
  onGoToDashboard,
  isLoggedIn,
  userEmail,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
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
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                100% Gratuito
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <PWAInstallButton />

            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition cursor-pointer"
              >
                <span>Acessar Painel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Entrar</span>
                </button>
                <button
                  onClick={onOpenRegister}
                  className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Criar Conta Grátis</span>
                  <span className="sm:hidden">Cadastrar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-900">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema 100% Gratuito • Sem pegadinhas ou mensalidades</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Controle suas finanças de forma simples e{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-500">
              fique sempre no azul.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Organize receitas e despesas, acompanhe gráficos inteligentes em tempo real e nunca mais perca o controle do seu dinheiro. Basta se cadastrar e começar.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-sm sm:text-base font-bold text-white shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Cadastre-se Gratuitamente</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Já tenho conta (Fazer Login)</span>
            </button>

            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-transparent text-xs sm:text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition cursor-pointer underline underline-offset-4"
            >
              Explorar demonstração sem login →
            </button>
          </div>

          {/* Trust bullets */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Dados protegidos via Supabase</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Instalável no Celular e PC (PWA)</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Mockup Card */}
        <div className="max-w-5xl mx-auto mt-12 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400">Painel Financeiro Interativo</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Ao vivo
            </span>
          </div>

          {/* 3 mini cards simulation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Receitas do Mês</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">R$ 8.135,50</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +12% vs mês anterior
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 uppercase">Despesas do Mês</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">R$ 3.820,00</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Alimentação, Moradia, Transporte</span>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">Saldo Positivo</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">R$ 4.315,50</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">53% de economia poupada</span>
            </div>
          </div>

          {/* Visual sample list */}
          <div className="rounded-xl bg-slate-100/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
              <span>ÚLTIMOS LANÇAMENTOS</span>
              <span>VALOR</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800 dark:text-white">Salário Mensal</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Salário</span>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">+ R$ 6.500,00</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-semibold text-slate-800 dark:text-white">Aluguel & Condomínio</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">Moradia</span>
              </div>
              <span className="font-bold text-rose-500 dark:text-rose-400">- R$ 1.850,00</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Main Direct Pillars */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Tudo o que você precisa, sem complicação
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Três pilares diretos para organizar suas finanças sem planilhas confusas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">1. Lançamentos em 10 Segundos</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Adicione receitas e despesas com categoria, forma de pagamento (Pix, cartão, boleto) e alterne status entre pago e pendente com 1 clique.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">2. Gráficos Visuais Claros</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Gráficos de Rosca e Barras mostram exatamente onde seu dinheiro está indo e para onde você pode direcionar mais economia no mês.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">3. PWA Instalável & Offline</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Instale o aplicativo direto no seu celular ou computador sem ocupar espaço. Funciona com total rapidez mesmo se a conexão cair.
            </p>
          </div>
        </div>
      </section>

      {/* Simple 3-step guide: Como funciona */}
      <section className="py-12 px-4 sm:px-8 bg-slate-100/60 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Passo a Passo Simples
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Como começar em menos de 1 minuto
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm">
                1
              </span>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Cadastre-se Grátis</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informe seu e-mail e crie uma senha. Não pedimos dados bancários nem cartão.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm">
                2
              </span>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Faça o Login</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acesse seu painel exclusivo e protegido com isolamento seguro de dados.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm">
                3
              </span>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Lance seus Gastos</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o saldo do mês, analise gráficos e conquiste sua tranquilidade financeira.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Box */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-100 dark:from-emerald-950/80 dark:via-slate-900 dark:to-teal-950/80 border border-emerald-300 dark:border-emerald-500/40 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            100% Gratuito Para Sempre
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Pronto para colocar suas finanças em ordem?
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Junte-se agora mesmo. Leva menos de 30 segundos para criar sua conta e começar a gerenciar seu dinheiro com segurança.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-sm sm:text-base font-bold text-white shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Minha Conta Grátis</span>
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Fazer Login</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-8 px-4 sm:px-8 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              C
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-300">ContandoDinheiro</span>
            <span>— Gestão Financeira Pessoal Gratuita</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
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
            <button
              onClick={onGoToDashboard}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              Acessar Painel
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
