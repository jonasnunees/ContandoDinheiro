import type { ScheduleOptions } from '../types';

interface TransactionScheduleFieldsProps {
  isEditing: boolean;
  hasSeries: boolean;
  loading: boolean;
  data: string;
  mode: ScheduleOptions['mode'];
  setMode: (value: ScheduleOptions['mode']) => void;
  count: number;
  setCount: (value: number) => void;
  end: string;
  setEnd: (value: string) => void;
  scope: 'one' | 'following';
  setScope: (value: 'one' | 'following') => void;
  cancelSeries: boolean;
  setCancelSeries: (value: boolean) => void;
}

// Seção controlada: o modal mantém os valores para validar e enviar uma única operação.
// Criar uma série usa o total da compra; editar usa o valor de uma ocorrência.
export function TransactionScheduleFields({
  isEditing,
  hasSeries,
  loading,
  data,
  mode,
  setMode,
  count,
  setCount,
  end,
  setEnd,
  scope,
  setScope,
  cancelSeries,
  setCancelSeries,
}: TransactionScheduleFieldsProps) {
  return (
    <>
      {!isEditing && (
        <div className="space-y-2">
          <label htmlFor="tx-repeat" className="field-label block">
            Repetição
          </label>
          <select
            id="tx-repeat"
            value={mode}
            disabled={loading}
            onChange={(e) => setMode(e.target.value as ScheduleOptions['mode'])}
            className="w-full rounded-xl border p-2 bg-white dark:bg-slate-950"
          >
            <option value="single">Não repetir</option>
            <option value="monthly">Mensal</option>
            <option value="installments">Parcelado mensalmente</option>
          </select>
          {mode === 'monthly' && (
            <>
              <label htmlFor="tx-end" className="field-label block">
                Repetir até (opcional)
              </label>
              <input
                id="tx-end"
                type="date"
                min={data}
                value={end}
                disabled={loading}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-xl border p-2 bg-white dark:bg-slate-950"
              />
              <p className="text-xs">
                Sem término, os próximos 12 meses são gerados ao abrir o painel.
              </p>
            </>
          )}
          {mode === 'installments' && (
            <>
              <label htmlFor="tx-count" className="field-label block">
                Número de parcelas
              </label>
              <input
                id="tx-count"
                type="number"
                min="2"
                max="360"
                required
                value={count}
                disabled={loading}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full rounded-xl border p-2 bg-white dark:bg-slate-950"
              />
              <p className="text-xs">
                Informe o valor total. Os centavos serão distribuídos entre as parcelas.
              </p>
            </>
          )}
          {mode !== 'single' && (
            <p className="text-xs">
              Ocorrências futuras começam pendentes. Datas no fim do mês são ajustadas para o último
              dia disponível.
            </p>
          )}
        </div>
      )}
      {hasSeries && (
        <div className="space-y-2">
          <label htmlFor="tx-scope" className="field-label block">
            Aplicar alteração
          </label>
          <select
            id="tx-scope"
            value={scope}
            disabled={loading}
            onChange={(e) => {
              setScope(e.target.value as 'one' | 'following');
              setCancelSeries(false);
            }}
            className="w-full rounded-xl border p-2 bg-white dark:bg-slate-950"
          >
            <option value="one">Somente este lançamento</option>
            <option value="following">Este e os próximos pendentes</option>
          </select>
          <p className="text-xs">
            Na edição, o valor corresponde a uma ocorrência. Alterações em conjunto preservam as já
            pagas e mantêm as demais pendentes.
          </p>
          {scope === 'following' && (
            <label className="field-label flex gap-2">
              <input
                type="checkbox"
                checked={cancelSeries}
                disabled={loading}
                onChange={(e) => setCancelSeries(e.target.checked)}
              />
              Cancelar este e os próximos pendentes
            </label>
          )}
        </div>
      )}
    </>
  );
}
