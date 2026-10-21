import { localDate, parseMoney } from '../validation';
import { Modal } from '../../../components/Modal';
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionDraft, TransactionType, TransactionStatus, PaymentMethod, Category, PAYMENT_METHODS, CATEGORIES, ScheduleOptions } from '../types';
import { X, Plus, Check, ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar as CalendarIcon, CreditCard, Tag, CheckCircle2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TransactionDraft, id?: string, options?: ScheduleOptions) => Promise<void>;
  transactionToEdit?: Transaction | null;
}

// Rótulos visuais das categorias; os valores persistidos continuam sendo os nomes de CATEGORIES.
const CATEGORY_LABELS: Record<Category, string> = {
  Alimentação: '🍔 Alimentação', Moradia: '🏠 Moradia', Transporte: '🚗 Transporte',
  Saúde: '💊 Saúde', Educação: '📚 Educação', Lazer: '🎉 Lazer', Salário: '💼 Salário',
  Investimentos: '📈 Investimentos', Serviços: '⚡ Serviços / Contas', Outros: '📦 Outros',
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
    setMode('single'); setCount(2); setEnd(''); setScope('one'); setCancelSeries(false);
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

  if (!isOpen) return null;

  // Impede o recarregamento da página, valida os campos e aguarda o salvamento antes de fechar.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loading) return;
    let numericValue: number;
    try { numericValue = parseMoney(valor); } catch (error) {
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
        { mode, count: mode === 'installments' ? count : undefined, end: mode === 'monthly' ? end || undefined : undefined, scope, cancel: cancelSeries }
      );
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a transação. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal titleId="transaction-title" onClose={onClose} busy={loading} className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 text-slate-800 dark:text-slate-100 transition-colors">
        {/* Título da janela e botão para fechá-la. */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <h2 id="transaction-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
            onClick={onClose} disabled={loading} aria-label="Fechar formulário"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campos preenchidos pela pessoa para cadastrar ou editar o lançamento. */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div id="transaction-error" role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Escolhe se o lançamento representa dinheiro recebido ou gasto. */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={tipo === 'receita'} disabled={loading} onClick={() => handleTypeChange('receita')}
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
              aria-pressed={tipo === 'despesa'} disabled={loading} onClick={() => handleTypeChange('despesa')}
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

          {!transactionToEdit && <div className="space-y-2">
            <label htmlFor="tx-repeat" className="block text-xs font-medium">Repetição</label>
            <select id="tx-repeat" value={mode} disabled={loading} onChange={e => setMode(e.target.value as ScheduleOptions['mode'])} className="w-full rounded-xl border p-2 bg-white dark:bg-slate-950">
              <option value="single">Não repetir</option><option value="monthly">Mensal</option><option value="installments">Parcelado mensalmente</option>
            </select>
            {mode === 'monthly' && <><label htmlFor="tx-end" className="block text-xs">Repetir até (opcional)</label><input id="tx-end" type="date" min={data} value={end} disabled={loading} onChange={e => setEnd(e.target.value)} className="w-full rounded-xl border p-2 bg-white dark:bg-slate-950" /><p className="text-xs">Sem término, os próximos 12 meses são gerados ao abrir o painel.</p></>}
            {mode === 'installments' && <><label htmlFor="tx-count" className="block text-xs">Número de parcelas</label><input id="tx-count" type="number" min="2" max="360" required value={count} disabled={loading} onChange={e => setCount(Number(e.target.value))} className="w-full rounded-xl border p-2 bg-white dark:bg-slate-950" /><p className="text-xs">Informe o valor total. Os centavos serão distribuídos entre as parcelas.</p></>}
            {mode !== 'single' && <p className="text-xs">Ocorrências futuras começam pendentes. Datas no fim do mês são ajustadas para o último dia disponível.</p>}
          </div>}
          {transactionToEdit?.serie_id && <div className="space-y-2">
            <label htmlFor="tx-scope" className="block text-xs font-medium">Aplicar alteração</label>
            <select id="tx-scope" value={scope} disabled={loading} onChange={e => { setScope(e.target.value as 'one' | 'following'); setCancelSeries(false); }} className="w-full rounded-xl border p-2 bg-white dark:bg-slate-950">
              <option value="one">Somente este lançamento</option><option value="following">Este e os próximos pendentes</option>
            </select>
            <p className="text-xs">Na edição, o valor corresponde a uma ocorrência. Alterações em conjunto preservam as já pagas e mantêm as demais pendentes.</p>
            {scope === 'following' && <label className="flex gap-2 text-sm"><input type="checkbox" checked={cancelSeries} disabled={loading} onChange={e => setCancelSeries(e.target.checked)} />Cancelar este e os próximos pendentes</label>}
          </div>}

          {/* Valor */}
          <div className="space-y-1.5">
            <label htmlFor="tx-valor" className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              {!transactionToEdit && mode === 'installments' ? 'Valor total da compra (R$)' : 'Valor (R$)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-600 dark:text-slate-400">
                R$
              </span>
              <input
                type="text"
                required
                inputMode="decimal"
                id="tx-valor" aria-describedby={error ? "transaction-error" : undefined} disabled={loading}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-3.5 py-2.5 text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label htmlFor="tx-descricao" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Descrição
            </label>
            <input
              type="text"
              required
              id="tx-descricao" aria-describedby={error ? "transaction-error" : undefined} disabled={loading}
                value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Salário, Aluguel, Supermercado, Cinema..."
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Categoria & Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="tx-categoria" className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                Categoria
              </label>
              <select
                id="tx-categoria" aria-describedby={error ? "transaction-error" : undefined} disabled={loading}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Category)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tx-pagamento" className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                Forma de Pagamento
              </label>
              <select
                id="tx-pagamento" aria-describedby={error ? "transaction-error" : undefined} disabled={loading}
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as PaymentMethod)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="tx-data" className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                Vencimento
              </label>
              <input
                type="date"
                required
                id="tx-data" aria-describedby={error ? "transaction-error" : undefined} disabled={loading}
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div id="status-label" className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                Situação / Status
              </div>
              <div role="group" aria-labelledby="status-label" className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={status === 'pago'} disabled={loading} onClick={() => { setStatus('pago'); if (status !== 'pago') setDataPagamento(localDate()); }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    status === 'pago'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tipo === 'receita' ? 'Recebido' : 'Pago'}
                </button>
                <button
                  type="button"
                  aria-pressed={status === 'pendente'} disabled={loading} onClick={() => setStatus('pendente')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    status === 'pendente'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-400'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Pendente
                </button>
              </div>
            </div>
          </div>

          {status === 'pago' && <div className="space-y-1.5">
            <label htmlFor="tx-paid-date" className="block text-xs font-medium">{tipo === 'receita' ? 'Data do recebimento' : 'Data do pagamento'}</label>
            <input id="tx-paid-date" type="date" max={localDate()} value={dataPagamento} disabled={loading} onChange={e => setDataPagamento(e.target.value)} className="w-full rounded-xl border p-2 bg-white dark:bg-slate-950" />
            {!dataPagamento && <p className="text-xs">Data não informada. Preencha somente se souber quando ocorreu.</p>}
          </div>}

          {/* Botões para cancelar ou confirmar o formulário. */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose} disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Salvando...' : transactionToEdit ? 'Atualizar Transação' : 'Cadastrar Transação'}
            </button>
          </div>
        </form>
    </Modal>
  );
};
