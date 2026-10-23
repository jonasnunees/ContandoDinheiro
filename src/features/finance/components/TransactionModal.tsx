import { TransactionScheduleFields } from './TransactionScheduleFields';
import { TransactionPaymentFields } from './TransactionPaymentFields';
import { localDate, parseMoney } from '../validation';
import { Modal } from '../../../components/Modal';
import React, { useState, useEffect } from 'react';
import {
  Transaction,
  TransactionDraft,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  Category,
  PAYMENT_METHODS,
  CATEGORIES,
  ScheduleOptions,
} from '../types';
import {
  X,
  Plus,
  Check,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  CreditCard,
  Tag,
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TransactionDraft, id?: string, options?: ScheduleOptions) => Promise<void>;
  transactionToEdit?: Transaction | null;
}

// Rótulos visuais das categorias; os valores persistidos continuam sendo os nomes de CATEGORIES.
const CATEGORY_LABELS: Record<Category, string> = {
  Alimentação: '🍔 Alimentação',
  Moradia: '🏠 Moradia',
  Transporte: '🚗 Transporte',
  Saúde: '💊 Saúde',
  Educação: '📚 Educação',
  Lazer: '🎉 Lazer',
  Salário: '💼 Salário',
  Investimentos: '📈 Investimentos',
  Serviços: '⚡ Serviços / Contas',
  Outros: '📦 Outros',
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
}) => {
  // Cada estado guarda um campo do formulário ou uma informação de carregamento/erro.
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<TransactionType>('despesa');
  const [data, setData] = useState(localDate());
  const [dataPagamento, setDataPagamento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>('Pix');
  const [status, setStatus] = useState<TransactionStatus>('pago');
  const [categoria, setCategoria] = useState<Category>('Alimentação');
  const [mode, setMode] = useState<ScheduleOptions['mode']>('single');
  const [count, setCount] = useState(2);
  const [end, setEnd] = useState('');
  const [scope, setScope] = useState<'one' | 'following'>('one');
  const [cancelSeries, setCancelSeries] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ao abrir, preenche os campos para edição ou restaura os valores de um novo lançamento.
  useEffect(() => {
    if (transactionToEdit) {
      setDescricao(transactionToEdit.descricao);
      setValor(transactionToEdit.valor.toFixed(2).replace('.', ','));
      setTipo(transactionToEdit.tipo);
      setData(transactionToEdit.data);
      setDataPagamento(transactionToEdit.data_pagamento ?? '');
      setFormaPagamento(transactionToEdit.forma_pagamento);
      setStatus(transactionToEdit.status);
      setCategoria(transactionToEdit.categoria);
    } else {
      setDescricao('');
      setValor('');
      setTipo('despesa');
      setData(localDate());
      setDataPagamento(localDate());
      setFormaPagamento('Pix');
      setStatus('pago');
      setCategoria('Alimentação');
    }
    setMode('single');
    setCount(2);
    setEnd('');
    setScope('one');
    setCancelSeries(false);
    setError('');
  }, [transactionToEdit, isOpen]);

  // Ao alternar receita/despesa, ajusta a categoria padrão de salário/alimentação.
  const handleTypeChange = (newType: TransactionType) => {
    setTipo(newType);
    if (newType === 'receita' && categoria === 'Alimentação') {
      setCategoria('Salário');
    } else if (newType === 'despesa' && categoria === 'Salário') {
      setCategoria('Alimentação');
    }
  };

  // Marcar como pago sugere hoje sem alterar o vencimento. Reabrir pendência preserva
  // o campo local; no envio, somente lançamentos pagos levam data de pagamento.
  const handleStatusChange = (nextStatus: TransactionStatus) => {
    setStatus(nextStatus);
    if (nextStatus === 'pago' && status !== 'pago') setDataPagamento(localDate());
  };

  if (!isOpen) return null;

  // Impede o recarregamento da página, valida os campos e aguarda o salvamento antes de fechar.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loading) return;
    let numericValue: number;
    try {
      numericValue = parseMoney(valor);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Valor inválido.');
      return;
    }
    if (!descricao.trim()) {
      setError('Informe a descrição da transação.');
      return;
    }
    setLoading(true);
    try {
      // Envia apenas o rascunho editável; o ID opcional distingue edição de criação.
      await onSave(
        {
          descricao: descricao.trim(),
          valor: numericValue,
          tipo,
          data,
          data_pagamento: status === 'pago' ? dataPagamento || null : null,
          forma_pagamento: formaPagamento,
          status,
          categoria,
        },
        transactionToEdit ? transactionToEdit.id : undefined,
        {
          mode,
          count: mode === 'installments' ? count : undefined,
          end: mode === 'monthly' ? end || undefined : undefined,
          scope,
          cancel: cancelSeries,
        },
      );
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a transação. Verifique os dados e tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      titleId="transaction-title"
      onClose={onClose}
      busy={loading}
      className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 text-slate-800 dark:text-slate-100 transition-colors"
    >
      {/* Título da janela e botão para fechá-la. */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
        <h2
          id="transaction-title"
          className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
        >
          {transactionToEdit ? (
            <>
              <Check className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Editar Lançamento
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Nova Transação
            </>
          )}
        </h2>
        <button
          onClick={onClose}
          disabled={loading}
          aria-label="Fechar formulário"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Campos preenchidos pela pessoa para cadastrar ou editar o lançamento. */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div
            id="transaction-error"
            role="alert"
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300"
          >
            {error}
          </div>
        )}

        {/* Escolhe se o lançamento representa dinheiro recebido ou gasto. */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            aria-pressed={tipo === 'receita'}
            disabled={loading}
            onClick={() => handleTypeChange('receita')}
            className={`py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border transition cursor-pointer ${
              tipo === 'receita'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Receita (Entrada)
          </button>
          <button
            type="button"
            aria-pressed={tipo === 'despesa'}
            disabled={loading}
            onClick={() => handleTypeChange('despesa')}
            className={`py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border transition cursor-pointer ${
              tipo === 'despesa'
                ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-400 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 text-rose-700 dark:text-rose-400" />
            Despesa (Saída)
          </button>
        </div>

        <TransactionScheduleFields
          isEditing={!!transactionToEdit}
          hasSeries={!!transactionToEdit?.serie_id}
          loading={loading}
          data={data}
          mode={mode}
          setMode={setMode}
          count={count}
          setCount={setCount}
          end={end}
          setEnd={setEnd}
          scope={scope}
          setScope={setScope}
          cancelSeries={cancelSeries}
          setCancelSeries={setCancelSeries}
        />

        {/* Valor */}
        <div className="space-y-1.5">
          <label
            htmlFor="tx-valor"
            className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            {!transactionToEdit && mode === 'installments'
              ? 'Valor total da compra (R$)'
              : 'Valor (R$)'}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-600 dark:text-slate-400">
              R$
            </span>
            <input
              type="text"
              required
              inputMode="decimal"
              id="tx-valor"
              aria-describedby={error ? 'transaction-error' : undefined}
              disabled={loading}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-3.5 py-2.5 text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <label
            htmlFor="tx-descricao"
            className="text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Descrição
          </label>
          <input
            type="text"
            required
            id="tx-descricao"
            aria-describedby={error ? 'transaction-error' : undefined}
            disabled={loading}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Salário, Aluguel, Supermercado, Cinema..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Categoria & Forma de Pagamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="tx-categoria"
              className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              Categoria
            </label>
            <select
              id="tx-categoria"
              aria-describedby={error ? 'transaction-error' : undefined}
              disabled={loading}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Category)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {CATEGORIES.map((category) => (
                <option
                  key={category}
                  value={category}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="tx-pagamento"
              className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              Forma de Pagamento
            </label>
            <select
              id="tx-pagamento"
              aria-describedby={error ? 'transaction-error' : undefined}
              disabled={loading}
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value as PaymentMethod)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option
                  key={pm}
                  value={pm}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TransactionPaymentFields
          data={data}
          setData={setData}
          status={status}
          onStatusChange={handleStatusChange}
          dataPagamento={dataPagamento}
          setDataPagamento={setDataPagamento}
          tipo={tipo}
          loading={loading}
          error={error}
        />

        {/* Botões para cancelar ou confirmar o formulário. */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950 transition cursor-pointer disabled:opacity-50"
          >
            {loading
              ? 'Salvando...'
              : transactionToEdit
                ? 'Atualizar Transação'
                : 'Cadastrar Transação'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
