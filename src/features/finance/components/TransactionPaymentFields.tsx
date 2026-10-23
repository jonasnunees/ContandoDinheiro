import { Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { localDate } from '../validation';
import type { TransactionStatus, TransactionType } from '../types';

interface TransactionPaymentFieldsProps {
  data: string;
  setData: (value: string) => void;
  status: TransactionStatus;
  onStatusChange: (value: TransactionStatus) => void;
  dataPagamento: string;
  setDataPagamento: (value: string) => void;
  tipo: TransactionType;
  loading: boolean;
  error: string;
}

// Vencimento e pagamento são datas independentes; pagamentos antigos podem não ter data conhecida.
export function TransactionPaymentFields({
  data,
  setData,
  status,
  onStatusChange,
  dataPagamento,
  setDataPagamento,
  tipo,
  loading,
  error,
}: TransactionPaymentFieldsProps) {
  return (
    <>
      {/* Data & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor="tx-data"
            className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            Vencimento
          </label>
          <input
            type="date"
            required
            id="tx-data"
            aria-describedby={error ? 'transaction-error' : undefined}
            disabled={loading}
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div
            id="status-label"
            className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            Situação / Status
          </div>
          <div role="group" aria-labelledby="status-label" className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={status === 'pago'}
              disabled={loading}
              onClick={() => onStatusChange('pago')}
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
              aria-pressed={status === 'pendente'}
              disabled={loading}
              onClick={() => onStatusChange('pendente')}
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

      {status === 'pago' && (
        <div className="space-y-1.5">
          <label htmlFor="tx-paid-date" className="block text-xs font-medium">
            {tipo === 'receita' ? 'Data do recebimento' : 'Data do pagamento'}
          </label>
          <input
            id="tx-paid-date"
            type="date"
            max={localDate()}
            value={dataPagamento}
            disabled={loading}
            onChange={(e) => setDataPagamento(e.target.value)}
            className="w-full rounded-xl border p-2 bg-white dark:bg-slate-950"
          />
          {!dataPagamento && (
            <p className="text-xs">
              Data não informada. Preencha somente se souber quando ocorreu.
            </p>
          )}
        </div>
      )}
    </>
  );
}
