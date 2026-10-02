import React, { useState } from 'react';
import { Transaction, TransactionStatus, TransactionType, Category } from '../types/finance';
import { logActivity } from '../services/activityLogger';
import { 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: TransactionStatus) => Promise<void>;
  filterState: {
    type: 'todos' | TransactionType;
    status: 'todos' | TransactionStatus;
    categoria: string;
    searchTerm: string;
  };
  onFilterChange: (updates: Partial<TransactionListProps['filterState']>) => void;
  onOpenNewModal: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Moradia: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  Transporte: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
  Saúde: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  Educação: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Lazer: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Salário: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Investimentos: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
  Serviços: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  Outros: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onToggleStatus,
  filterState,
  onFilterChange,
  onOpenNewModal,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const header = ['ID', 'Data', 'Descrição', 'Tipo', 'Categoria', 'Forma de Pagamento', 'Valor', 'Status'];
    const rows = transactions.map((t) => [
      t.id,
      t.data,
      `"${t.descricao.replace(/"/g, '""')}"`,
      t.tipo,
      `"${t.categoria}"`,
      `"${t.forma_pagamento}"`,
      t.valor.toFixed(2),
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transacoes_contandodinheiro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logActivity('exportar_planilha_csv', { total_transacoes: transactions.length });
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
      {/* Search & Filters Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={filterState.searchTerm}
              onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
              placeholder="Buscar por descrição..."
              className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Type selector */}
            <select
              value={filterState.type}
              onChange={(e) => onFilterChange({ type: e.target.value as any })}
              className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="receita">Receitas (Entradas)</option>
              <option value="despesa">Despesas (Saídas)</option>
            </select>

            {/* Status selector */}
            <select
              value={filterState.status}
              onChange={(e) => onFilterChange({ status: e.target.value as any })}
              className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              <option value="todos">Todos os Status</option>
              <option value="pago">Pagos / Recebidos</option>
              <option value="pendente">Pendentes</option>
            </select>

            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer shadow-sm"
              title="Exportar dados para planilha Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Content */}
      {transactions.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Nenhuma transação encontrada</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Não há lançamentos para os filtros ou mês selecionados. Que tal cadastrar uma nova transação agora?
          </p>
          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer shadow-lg shadow-emerald-950/20"
          >
            + Cadastrar Transação
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {transactions.map((tx) => {
                  const isReceita = tx.tipo === 'receita';
                  const isPago = tx.status === 'pago';
                  const catColor = CATEGORY_COLORS[tx.categoria] || CATEGORY_COLORS.Outros;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition group"
                    >
                      {/* Tipo Icon */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                            isReceita
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {isReceita ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                      </td>

                      {/* Descrição */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {tx.descricao}
                      </td>

                      {/* Categoria Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${catColor}`}
                        >
                          {tx.categoria}
                        </span>
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {tx.forma_pagamento}
                      </td>

                      {/* Data */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(tx.data)}
                      </td>

                      {/* Valor */}
                      <td
                        className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                          isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isReceita ? '+ ' : '- '}
                        {formatCurrency(tx.valor)}
                      </td>

                      {/* 1-Click Status Toggle */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus(tx.id, tx.status)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                            isPago
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title="Clique para alternar entre Pago/Recebido e Pendente"
                        >
                          {isPago ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isReceita ? 'Recebido' : 'Pago'}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pendente</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Ações: Editar e Excluir */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {deleteConfirmId === tx.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">Excluir?</span>
                            <button
                              onClick={async () => {
                                await onDelete(tx.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => onEdit(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Editar transação"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(tx.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Excluir transação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Mobile-First Polish) */}
          <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800/80">
            {transactions.map((tx) => {
              const isReceita = tx.tipo === 'receita';
              const isPago = tx.status === 'pago';
              const catColor = CATEGORY_COLORS[tx.categoria] || CATEGORY_COLORS.Outros;

              return (
                <div key={tx.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                          isReceita
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {isReceita ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tx.descricao}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{formatDate(tx.data)}</span>
                          <span>•</span>
                          <span>{tx.forma_pagamento}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-right font-black text-sm ${
                        isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isReceita ? '+ ' : '- '}
                      {formatCurrency(tx.valor)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${catColor}`}>
                        {tx.categoria}
                      </span>
                      {/* 1-Click Status */}
                      <button
                        onClick={() => onToggleStatus(tx.id, tx.status)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                          isPago
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isPago ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{isPago ? (isReceita ? 'Recebido' : 'Pago') : 'Pendente'}</span>
                      </button>
                    </div>

                    {/* Actions */}
                    {deleteConfirmId === tx.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => {
                            await onDelete(tx.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-1 rounded bg-rose-600 text-white text-xs font-bold"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
