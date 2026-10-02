import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, Category } from '../types/finance';
import { X, Plus, Check, ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar as CalendarIcon, CreditCard, Tag, CheckCircle2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Transaction, 'id' | 'created_at'>, id?: string) => Promise<void>;
  transactionToEdit?: Transaction | null;
}

const CATEGORIES: { name: Category; label: string }[] = [
  { name: 'Alimentação', label: '🍔 Alimentação' },
  { name: 'Moradia', label: '🏠 Moradia' },
  { name: 'Transporte', label: '🚗 Transporte' },
  { name: 'Saúde', label: '💊 Saúde' },
  { name: 'Educação', label: '📚 Educação' },
  { name: 'Lazer', label: '🎉 Lazer' },
  { name: 'Salário', label: '💼 Salário' },
  { name: 'Investimentos', label: '📈 Investimentos' },
  { name: 'Serviços', label: '⚡ Serviços / Contas' },
  { name: 'Outros', label: '📦 Outros' },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Pix',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Boleto',
  'Transferência',
  'Outro',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
}) => {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<TransactionType>('despesa');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>('Pix');
  const [status, setStatus] = useState<TransactionStatus>('pago');
  const [categoria, setCategoria] = useState<Category>('Alimentação');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setDescricao(transactionToEdit.descricao);
      setValor(transactionToEdit.valor.toString());
      setTipo(transactionToEdit.tipo);
      setData(transactionToEdit.data);
      setFormaPagamento(transactionToEdit.forma_pagamento);
      setStatus(transactionToEdit.status);
      setCategoria(transactionToEdit.categoria);
    } else {
      setDescricao('');
      setValor('');
      setTipo('despesa');
      setData(new Date().toISOString().slice(0, 10));
      setFormaPagamento('Pix');
      setStatus('pago');
      setCategoria('Alimentação');
    }
    setError('');
  }, [transactionToEdit, isOpen]);

  // When changing type, set sensible category default
  const handleTypeChange = (newType: TransactionType) => {
    setTipo(newType);
    if (newType === 'receita' && categoria === 'Alimentação') {
      setCategoria('Salário');
    } else if (newType === 'despesa' && categoria === 'Salário') {
      setCategoria('Alimentação');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericValue = parseFloat(valor.replace(',', '.'));
    if (!descricao.trim()) {
      setError('Informe a descrição da transação.');
      return;
    }
    if (isNaN(numericValue) || numericValue <= 0) {
      setError('Informe um valor numérico válido maior que zero.');
      return;
    }

    setLoading(true);
    try {
      await onSave(
        {
          descricao: descricao.trim(),
          valor: numericValue,
          tipo,
          data,
          forma_pagamento: formaPagamento,
          status,
          categoria,
          user_id: '', // Handled by service
        },
        transactionToEdit ? transactionToEdit.id : undefined
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar transação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {transactionToEdit ? (
              <>
                <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                Editar Lançamento
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                Nova Transação
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Tipo Selector (Receita vs Despesa) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('receita')}
              className={`py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border transition cursor-pointer ${
                tipo === 'receita'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Receita (Entrada)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('despesa')}
              className={`py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border transition cursor-pointer ${
                tipo === 'despesa'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              Despesa (Saída)
            </button>
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                required
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-3.5 py-2.5 text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Descrição
            </label>
            <input
              type="text"
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Salário, Aluguel, Supermercado, Cinema..."
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Categoria & Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Category)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                Forma de Pagamento
              </label>
              <select
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
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                Data
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                Situação / Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('pago')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    status === 'pago'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tipo === 'receita' ? 'Recebido' : 'Pago'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pendente')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    status === 'pendente'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Pendente
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Salvando...' : transactionToEdit ? 'Atualizar Transação' : 'Cadastrar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
