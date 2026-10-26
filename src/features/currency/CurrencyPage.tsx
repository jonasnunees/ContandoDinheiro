import { BrandLogo } from '../../components/BrandLogo';
import { lazy, Suspense, useState } from 'react';
import { Footer } from '../../components/Footer';
import { ArrowLeftRight, RefreshCw } from 'lucide-react';
import { ToolsMenu } from '../../components/ToolsMenu';
import { ThemeToggle } from '../../components/ThemeToggle';
import {
  currencies,
  parseAmount,
  exchangeRate,
  convert,
  formatMoney,
  quoteTimestamp,
} from './calculations';
import { useQuotes } from './useQuotes';
import { isCurrency } from './catalog';
import { CurrencyHistory } from './CurrencyHistory';
import type { Currency } from './types';
const AuthModal = lazy(() =>
  import('../auth/AuthModal').then((module) => ({ default: module.AuthModal })),
);
const field =
  'w-full min-w-0 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-3 focus-visible:outline-2 focus-visible:outline-emerald-600';
export default function CurrencyPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState<Currency>('USD');
  const [to, setTo] = useState<Currency>('BRL');
  const same = from === to;
  const { data, loading, error, refresh } = useQuotes(from, to);
  const number = parseAmount(amount);
  const rate = exchangeRate(from, to, data);
  const result = number !== null && rate !== null ? convert(number, rate) : null;
  const timestamp = !same && data ? quoteTimestamp(from, to, data) : null;
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <BrandLogo />
          <div className="flex flex-wrap items-center gap-2">
            <ToolsMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Conversor de moedas</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Consulte o câmbio e converta valores gratuitamente, sem precisar entrar.
        </p>
        <section
          aria-label="Conversão"
          className="mt-8 space-y-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-8"
        >
          <div>
            <label className="field-label" htmlFor="currency-amount">
              Valor
            </label>
            <input
              id="currency-amount"
              className={field}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-invalid={number === null}
              aria-describedby={number === null ? 'amount-error' : undefined}
            />
            {number === null && (
              <p id="amount-error" className="mt-2 text-sm text-rose-700 dark:text-rose-300">
                Informe um valor válido, igual ou maior que zero. Use vírgula para decimais.
              </p>
            )}
          </div>
          <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="min-w-0">
              <label className="field-label" htmlFor="currency-from">
                De
              </label>
              <select
                id="currency-from"
                className={field}
                value={from}
                onChange={(event) => isCurrency(event.target.value) && setFrom(event.target.value)}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              aria-label="Inverter moedas"
              onClick={() => {
                setFrom(to);
                setTo(from);
              }}
              className="justify-self-center rounded-xl border border-slate-300 dark:border-slate-700 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              <ArrowLeftRight aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <label className="field-label" htmlFor="currency-to">
                Para
              </label>
              <select
                id="currency-to"
                className={field}
                value={to}
                onChange={(event) => isCurrency(event.target.value) && setTo(event.target.value)}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="space-y-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-5"
          >
            {!same && loading && <p>Consultando cotação…</p>}
            {!same && data && (loading || error) && (
              <p className="font-semibold">Cotação anterior</p>
            )}
            {result !== null && (
              <p className="break-words text-3xl font-bold text-emerald-800 dark:text-emerald-300">
                {formatMoney(result, to)}
              </p>
            )}
            {number !== null && rate !== null && result === null && (
              <p>Valor muito alto para converter. Informe um valor menor.</p>
            )}
            {rate !== null && (
              <p className="break-words text-sm">
                1 {from} = {formatMoney(rate, to, true)}
              </p>
            )}
            {same ? (
              <p className="text-sm">Mesma moeda: taxa 1, sem consulta à API.</p>
            ) : (
              timestamp && (
                <p className="text-sm">
                  Cotação de{' '}
                  {new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'medium',
                  }).format(timestamp)}
                </p>
              )
            )}
          </div>
          {!same && error && (
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}
          {!same && (
            <button
              type="button"
              disabled={loading}
              onClick={() => void refresh()}
              className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`}
              />
              {error ? 'Tentar novamente' : 'Atualizar cotação'}
            </button>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Cotação de referência. O valor cobrado pode variar.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fonte:{' '}
            <a
              href="https://docs.awesomeapi.com.br/api-de-moedas"
              className="underline underline-offset-4"
            >
              AwesomeAPI
            </a>
            . Taxas inversas e cruzadas calculadas a partir das referências de compra (bid) das
            moedas selecionadas em BRL. Em conversões cruzadas, exibimos a data da referência mais
            antiga.
          </p>
        </section>
        <CurrencyHistory from={from} to={to} />
      </main>
      <Footer onOpenLogin={() => setIsAuthOpen(true)} onOpenRegister={() => setIsAuthOpen(true)} />
      {isAuthOpen && (
        <Suspense
          fallback={
            <p role="status" className="px-4 py-2">
              Carregando acesso…
            </p>
          }
        >
          <AuthModal
            isOpen
            onClose={() => setIsAuthOpen(false)}
            onAuthSuccess={() => window.location.assign('/demo')}
          />
        </Suspense>
      )}
    </div>
  );
}
