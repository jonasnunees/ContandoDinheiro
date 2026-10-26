import { lazy, Suspense, useState } from 'react';
import { useHistory } from './useHistory';
import { formatDate } from './history';
import { formatMoney } from './calculations';
import type { Currency } from './types';
const CurrencyChart = lazy(() => import('./CurrencyChart'));
export function CurrencyHistory({ from, to }: { from: Currency; to: Currency }) {
  const [months, setMonths] = useState<1 | 3 | 6>(3);
  const { points, partial, fetchedAt, loading, error, refresh } = useHistory(from, to, months);
  const same = from === to;
  return (
    <section
      aria-labelledby="history-heading"
      className="mt-8 min-w-0 space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-8"
    >
      <h2 id="history-heading" className="text-xl font-bold">
        Histórico da cotação
      </h2>
      <p className="font-semibold">
        1 {from} em {to}
      </p>
      <div role="group" aria-label="Período do histórico" className="flex flex-wrap gap-2">
        {([1, 3, 6] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={months === value}
            onClick={() => setMonths(value)}
            className={`rounded-xl border px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${months === value ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}
          >
            {value} {value === 1 ? 'mês' : 'meses'}
          </button>
        ))}
      </div>
      {same ? (
        <p>Mesma moeda: taxa constante 1. Não é necessário consultar histórico.</p>
      ) : (
        <>
          <div aria-live="polite" aria-atomic="true">
            {loading && <p>Consultando histórico…</p>}
            {points && (loading || error) && (
              <p>
                Histórico anterior, consultado em{' '}
                {fetchedAt
                  ? new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                      timeZone: 'America/Sao_Paulo',
                    }).format(fetchedAt)
                  : '—'}
                .
              </p>
            )}
            {points && points.length < 2 && (
              <p>Histórico insuficiente: menos de duas observações válidas no período.</p>
            )}
            {partial && (
              <p>
                Cobertura parcial: registros inválidos ou datas sem correspondência foram excluídos.
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className="text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}
          {points && points.length >= 2 && (
            <>
              <p>
                Datas disponíveis: {formatDate(points[0].date)} a{' '}
                {formatDate(points[points.length - 1].date)} · {points.length} observações.
              </p>
              <Suspense fallback={<p>Carregando gráfico…</p>}>
                <CurrencyChart points={points} from={from} to={to} />
              </Suspense>
              <details>
                <summary className="cursor-pointer rounded py-2 font-semibold focus-visible:outline-2 focus-visible:outline-emerald-600">
                  Ver tabela de datas e taxas
                </summary>
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="py-2">
                      Valor de 1 {from} em {to}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className="p-2">
                          Data
                        </th>
                        <th scope="col" className="p-2">
                          Taxa
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {points.map((p) => (
                        <tr key={p.date}>
                          <th scope="row" className="p-2 font-normal">
                            {formatDate(p.date)}
                          </th>
                          <td className="p-2">{formatMoney(p.bid, to, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            {error ? 'Tentar histórico novamente' : 'Atualizar histórico'}
          </button>
        </>
      )}
      <p id="history-description" className="text-sm text-slate-600 dark:text-slate-300">
        Fonte: AwesomeAPI. Referências diárias de compra (bid), que podem diferir da cotação atual.
        Datas em São Paulo; o dia atual é excluído por poder estar em andamento. Lacunas indicam
        ausência de publicação ou de datas comuns entre as referências; não há interpolação. A
        cobertura pode não alcançar todo o período solicitado.
      </p>
    </section>
  );
}
