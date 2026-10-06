import React from 'react';
import { SummaryStats } from '../types/finance';
import { TrendingUp, TrendingDown, Wallet, Clock, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface SummaryCardsProps {
  stats: SummaryStats;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const isSaldoPositive = stats.saldoAtual >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total de Entradas (Receitas) */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Entradas (Receitas)
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(stats.totalEntradas)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Recebido no período
            </span>
            {stats.totalPendentesReceber > 0 && (
              <span className="text-amber-800 dark:text-amber-400 text-[11px] font-medium" title="A receber">
                + {formatCurrency(stats.totalPendentesReceber)} pendente
              </span>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
      </div>

      {/* 2. Total de Saídas (Despesas) */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Saídas (Despesas)
          </span>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(stats.totalSaidas)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" />
              Gasto no período
            </span>
            {stats.totalPendentesPagar > 0 && (
              <span className="text-amber-800 dark:text-amber-400 text-[11px] font-medium" title="A pagar">
                + {formatCurrency(stats.totalPendentesPagar)} a pagar
              </span>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
      </div>

      {/* 3. Saldo Atual */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            Saldo do Período
          </span>
          <div
            className={`p-2.5 rounded-xl border ${
              isSaldoPositive
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-2xl font-black tracking-tight ${
              isSaldoPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {formatCurrency(stats.saldoAtual)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {isSaldoPositive ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Superávit (No Azul)</span>
              ) : (
                <span className="text-rose-700 dark:text-rose-400 font-semibold">Déficit (No Vermelho)</span>
              )}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {stats.quantidadeTransacoes} transaç{stats.quantidadeTransacoes === 1 ? 'ão' : 'ões'}
            </span>
          </div>
        </div>
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 ${
            isSaldoPositive
              ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
              : 'bg-gradient-to-r from-rose-500 to-red-600'
          }`}
        />
      </div>

      {/* 4. Taxa de Economia & Previsão */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <PiggyBank className="w-3.5 h-3.5" />
            Percentual economizado
          </span>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.taxaEconomia > 0 ? `${stats.taxaEconomia.toFixed(1)}%` : '0%'}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {stats.totalEntradas > 0
                ? `Você gastou ${Math.round((stats.totalSaidas / stats.totalEntradas) * 100)}% da sua renda`
                : 'Sem receitas'}
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
      </div>
    </div>
  );
};
