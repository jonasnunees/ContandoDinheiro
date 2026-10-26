import { formatCurrency } from '../formatCurrency';
import { occurrenceLabel } from '../scheduling';
import { localDate } from '../validation';
import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionStatus, FilterState } from '../types';
import { serializeCSV } from '../csv';
import {
  Search,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

interface TransactionListProps {
  revealId?: string;
  onRevealed?: () => void;
  transactions: Transaction[];
  hasPeriodTransactions: boolean;
  onEdit: (transaction: Transaction) => void;
  onDuplicate: (transaction: Transaction) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: TransactionStatus) => Promise<void>;
  filterState: FilterState;
  onFilterChange: (updates: Partial<TransactionListProps['filterState']>) => void;
  onOpenNewModal: () => void;
}

// Associa cada categoria às cores do seu selo na lista.
const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: 'bg-orange-500/10 text-orange-800 dark:text-orange-400 border-orange-500/20',
  Moradia: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  Transporte: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
  Saúde: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  Educação: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Lazer: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Salário: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Investimentos: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
  Serviços: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  Outros: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  revealId,
  onRevealed,
  hasPeriodTransactions,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
  filterState,
  onFilterChange,
  onOpenNewModal,
}) => {
  const highlightTimer = useRef<number | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);
  const revealedCallback = useRef(onRevealed);
  revealedCallback.current = onRevealed;
  useEffect(() => {
    if (!revealId) return;
    const item = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-transaction-id]') ?? [],
    ).find(
      (element) =>
        element.dataset.transactionId === revealId && element.getClientRects().length > 0,
    );
    if (!item) return;
    listRef.current
      ?.querySelectorAll('[data-saved-highlight]')
      .forEach((element) => element.removeAttribute('data-saved-highlight'));
    window.clearTimeout(highlightTimer.current);
    item.dataset.savedHighlight = 'true';
    highlightTimer.current = window.setTimeout(
      () => item.removeAttribute('data-saved-highlight'),
      8000,
    );
    item.focus({ preventScroll: true });
    item.scrollIntoView({
      block: 'center',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
    revealedCallback.current?.();
  }, [revealId]);
  // Apenas a decoração expira por tempo; a navegação depende dos dados carregados.
  useEffect(() => () => window.clearTimeout(highlightTimer.current), []);
  const searchRef = useRef<HTMLInputElement>(null);
  const clearFilters = () => {
    onFilterChange({ type: 'todos', status: 'todos', searchTerm: '' });
    // A ação do estado vazio desaparece após a limpeza; a busca permanece na tela.
    searchRef.current?.focus();
  };

  // O primeiro clique pede confirmação na própria linha/cartão; o segundo executa a exclusão.
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Guarda quais lançamentos estão sendo alterados para impedir cliques repetidos na mesma ação.
  // A ref bloqueia imediatamente um segundo clique, antes da próxima renderização.
  // busyIds copia esse conjunto para atualizar os botões; IDs distintos podem operar em paralelo.
  const pending = useRef(new Set<string>());
  const [busyIds, setBusyIds] = useState(new Set<string>());
  const [actionError, setActionError] = useState('');
  const runAction = async (id: string, action: () => Promise<void>) => {
    if (pending.current.has(id)) return;
    pending.current.add(id);
    setBusyIds(new Set(pending.current));
    setActionError('');
    try {
      await action();
      setDeleteConfirmId(null);
    } catch {
      setActionError(
        'Não foi possível concluir a operação. Verifique sua conexão e tente novamente.',
      );
    } finally {
      pending.current.delete(id);
      setBusyIds(new Set(pending.current));
    }
  };

  // Reorganiza o texto da data para dia/mês/ano, sem conversão de fuso horário.
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  // Monta uma tabela dos lançamentos exibidos e cria um arquivo CSV para baixar.
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const header = [
      'ID',
      'Vencimento',
      'Data do pagamento',
      'Descrição',
      'Tipo',
      'Categoria',
      'Forma de Pagamento',
      'Valor',
      'Status',
      'Recorrência / Parcela',
    ];
    const rows = transactions.map((t) => [
      t.id,
      t.data,
      t.data_pagamento ?? '',
      t.descricao,
      t.tipo,
      t.categoria,
      t.forma_pagamento,
      t.valor.toFixed(2),
      t.status,
      occurrenceLabel(t),
    ]);
    const objectUrl = URL.createObjectURL(
      new Blob([serializeCSV([header, ...rows])], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.setAttribute('href', objectUrl);
    link.setAttribute('download', `transacoes_contandodinheiro_${localDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Libera o endereço temporário do arquivo após iniciar o download.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  return (
    <div
      ref={listRef}
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors"
    >
      {actionError && (
        <p role="alert" className="p-4 text-rose-700 dark:text-rose-300">
          {actionError}
        </p>
      )}
      {/* Busca e opções que definem quais lançamentos aparecem. */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de busca por descrição, categoria ou forma de pagamento. */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-600 dark:text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              aria-label="Buscar transações"
              value={filterState.searchTerm}
              onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
              placeholder="Buscar por descrição..."
              className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Filtros de tipo e situação do lançamento. */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Escolhe receitas, despesas ou ambas. */}
            <select
              aria-label="Filtrar por tipo"
              value={filterState.type}
              onChange={(e) =>
                onFilterChange({
                  type: e.target.value as TransactionListProps['filterState']['type'],
                })
              }
              className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="receita">Receitas (Entradas)</option>
              <option value="despesa">Despesas (Saídas)</option>
            </select>

            {/* Escolhe lançamentos pagos, pendentes ou ambos. */}
            <select
              aria-label="Filtrar por situação"
              value={filterState.status}
              onChange={(e) =>
                onFilterChange({
                  status: e.target.value as TransactionListProps['filterState']['status'],
                })
              }
              className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              <option value="todos">Todos os Status</option>
              <option value="pago">Pagos / Recebidos</option>
              <option value="pendente">Pendentes</option>
            </select>

            {/* Baixa os lançamentos exibidos em um arquivo para planilhas. */}
            <button
              aria-label="Exportar transações para CSV"
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
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400 cursor-pointer transition"
        >
          Limpar busca e filtros
        </button>
      </div>

      {/* Mostra a lista ou uma mensagem quando não há lançamentos. */}
      {transactions.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {hasPeriodTransactions
              ? 'Nenhum lançamento corresponde aos filtros'
              : 'Nenhum lançamento neste período'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            {hasPeriodTransactions
              ? 'Limpe a busca e os filtros para ver os lançamentos do período.'
              : 'Cadastre uma transação para começar a registrar este período.'}
          </p>
          <button
            type="button"
            onClick={hasPeriodTransactions ? clearFilters : onOpenNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold text-white transition cursor-pointer shadow-lg shadow-emerald-950/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400"
          >
            {hasPeriodTransactions ? 'Limpar filtros' : 'Cadastrar transação'}
          </button>
        </div>
      ) : (
        <>
          {/* Em telas maiores, organiza os lançamentos em uma tabela. */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">
                    Tipo
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Descrição
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Categoria
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Pagamento
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Vencimento / pagamento
                  </th>
                  <th scope="col" className="py-3 px-4 text-right">
                    Valor
                  </th>
                  <th scope="col" className="py-3 px-4 text-center">
                    Status
                  </th>
                  <th scope="col" className="py-3 px-4 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {transactions.map((tx) => {
                  const isReceita = tx.tipo === 'receita';
                  const isPago = tx.status === 'pago';
                  const catColor = Object.hasOwn(CATEGORY_COLORS, tx.categoria)
                    ? CATEGORY_COLORS[tx.categoria]
                    : CATEGORY_COLORS.Outros;

                  return (
                    <tr
                      key={tx.id}
                      data-transaction-id={tx.id}
                      tabIndex={-1}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition group"
                    >
                      {/* Ícone que identifica entrada ou saída de dinheiro. */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                            isReceita
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
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
                        <span className="saved-marker text-xs font-normal">
                          {' '}
                          · Lançamento salvo
                        </span>
                        {tx.serie_id && (
                          <span className="ml-2 text-xs font-normal">({occurrenceLabel(tx)})</span>
                        )}
                      </td>

                      {/* Selo colorido que identifica a categoria. */}
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
                        Venc.: {formatDate(tx.data)}
                        {tx.status === 'pago' && (
                          <span className="block text-xs">
                            {tx.tipo === 'receita' ? 'Recebido' : 'Pago'}:{' '}
                            {tx.data_pagamento
                              ? formatDate(tx.data_pagamento)
                              : 'data não informada'}
                          </span>
                        )}
                      </td>

                      {/* Valor */}
                      <td
                        className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                          isReceita
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {isReceita ? '+ ' : '- '}
                        {formatCurrency(tx.valor)}
                      </td>

                      {/* Botão que alterna o lançamento entre pago e pendente. */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          disabled={busyIds.has(tx.id)}
                          aria-label={`Alterar situação de ${tx.descricao}`}
                          onClick={() => runAction(tx.id, () => onToggleStatus(tx.id, tx.status))}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                            isPago
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-800/20'
                              : 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
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
                            <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                              Excluir?
                            </span>
                            <button
                              disabled={busyIds.has(tx.id)}
                              aria-label={`Confirmar exclusão de ${tx.descricao}`}
                              onClick={() => runAction(tx.id, () => onDelete(tx.id))}
                              className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                            >
                              Sim
                            </button>
                            <button
                              disabled={busyIds.size > 0}
                              aria-label="Cancelar exclusão"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={busyIds.has(tx.id)}
                              aria-label={`Duplicar lançamento ${tx.descricao}`}
                              data-focus-return={`duplicate-${tx.id}`}
                              title="Duplicar lançamento"
                              onClick={() => onDuplicate(tx)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-600"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              disabled={busyIds.has(tx.id)}
                              aria-label={`Editar ${tx.descricao}`}
                              onClick={() => onEdit(tx)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Editar transação"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              disabled={busyIds.has(tx.id)}
                              aria-label={`Excluir ${tx.descricao}`}
                              onClick={() => setDeleteConfirmId(tx.id)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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

          {/* No celular, exibe cada lançamento em um cartão. */}
          <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800/80">
            {transactions.map((tx) => {
              const isReceita = tx.tipo === 'receita';
              const isPago = tx.status === 'pago';
              const catColor = Object.hasOwn(CATEGORY_COLORS, tx.categoria)
                ? CATEGORY_COLORS[tx.categoria]
                : CATEGORY_COLORS.Outros;

              return (
                <div
                  key={tx.id}
                  data-transaction-id={tx.id}
                  tabIndex={-1}
                  className="p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                          isReceita
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {isReceita ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {tx.descricao}
                          <span className="saved-marker text-xs font-normal">
                            {' '}
                            · Lançamento salvo
                          </span>
                          {tx.serie_id && (
                            <span className="ml-2 text-xs font-normal">
                              ({occurrenceLabel(tx)})
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>
                            Venc.: {formatDate(tx.data)}
                            {tx.status === 'pago' && (
                              <span className="block text-xs">
                                {tx.tipo === 'receita' ? 'Recebido' : 'Pago'}:{' '}
                                {tx.data_pagamento
                                  ? formatDate(tx.data_pagamento)
                                  : 'data não informada'}
                              </span>
                            )}
                          </span>
                          <span>•</span>
                          <span>{tx.forma_pagamento}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-right font-black text-sm ${
                        isReceita
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {isReceita ? '+ ' : '- '}
                      {formatCurrency(tx.valor)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${catColor}`}
                      >
                        {tx.categoria}
                      </span>
                      {/* Botão que alterna o lançamento entre pago e pendente. */}
                      <button
                        disabled={busyIds.has(tx.id)}
                        aria-label={`Alterar situação de ${tx.descricao}`}
                        onClick={() => runAction(tx.id, () => onToggleStatus(tx.id, tx.status))}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                          isPago
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isPago ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{isPago ? (isReceita ? 'Recebido' : 'Pago') : 'Pendente'}</span>
                      </button>
                    </div>

                    {/* Ações para editar ou excluir o lançamento. */}
                    {deleteConfirmId === tx.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          disabled={busyIds.has(tx.id)}
                          aria-label={`Confirmar exclusão de ${tx.descricao}`}
                          onClick={() => runAction(tx.id, () => onDelete(tx.id))}
                          className="px-2 py-1 rounded bg-rose-600 text-white text-xs font-bold"
                        >
                          Confirmar
                        </button>
                        <button
                          disabled={busyIds.size > 0}
                          aria-label="Cancelar exclusão"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={busyIds.has(tx.id)}
                          aria-label={`Duplicar lançamento ${tx.descricao}`}
                          data-focus-return={`duplicate-${tx.id}`}
                          title="Duplicar lançamento"
                          onClick={() => onDuplicate(tx)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          disabled={busyIds.has(tx.id)}
                          aria-label={`Editar ${tx.descricao}`}
                          onClick={() => onEdit(tx)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          disabled={busyIds.has(tx.id)}
                          aria-label={`Excluir ${tx.descricao}`}
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
