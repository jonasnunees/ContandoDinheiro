import { useState } from 'react';
import { CATEGORIES, type Category, type Transaction } from '../types';
import { monthlySpending, readBudgets, saveBudgets } from '../budgets';

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function MonthlyBudgets({
  storageKey,
  transactions,
  month,
  year,
}: {
  storageKey: string;
  transactions: Transaction[];
  month: number;
  year: number;
}) {
  const [initial] = useState(() => {
    try {
      return { budgets: readBudgets(storageKey), error: '' };
    } catch (error) {
      return { budgets: {}, error: (error as Error).message };
    }
  });
  const [budgets, setBudgets] = useState(initial.budgets);
  const [error, setError] = useState(initial.error);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<Category>('Alimentação');
  const [amount, setAmount] = useState('');
  const spending = monthlySpending(transactions, month, year);

  function persist(next: typeof budgets) {
    try {
      saveBudgets(storageKey, next);
      setBudgets(next);
      setError('');
      setMessage('Orçamento atualizado.');
      return true;
    } catch (error) {
      setError((error as Error).message);
      setMessage('');
      return false;
    }
  }

  return (
    <section
      aria-labelledby="budgets-title"
      className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
    >
      <div>
        <h3 id="budgets-title" className="font-bold">
          Orçamento mensal por categoria
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Despesas pagas no mês selecionado, sem os filtros do extrato. Limites salvos apenas neste
          navegador, por conta e mês.
        </p>
      </div>
      {initial.error ? (
        <p role="alert">{initial.error} Os dados foram preservados.</p>
      ) : (
        <>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const limit = Number(amount.replace(',', '.'));
              if (
                !Number.isFinite(limit) ||
                limit <= 0 ||
                !Number.isSafeInteger(Math.round(limit * 100))
              ) {
                setError('Informe um limite maior que zero, com até duas casas decimais.');
                return;
              }
              if (persist({ ...budgets, [category]: Math.round(limit * 100) / 100 })) setAmount('');
            }}
          >
            <label className="field-label">
              Categoria
              <select
                className="block mt-1 rounded-lg border border-slate-400 bg-white dark:bg-slate-950 p-2"
                value={category}
                onChange={(event) => {
                  const next = event.target.value as Category;
                  setCategory(next);
                  setAmount(budgets[next]?.toString() ?? '');
                }}
              >
                {CATEGORIES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Limite mensal (R$)
              <input
                className="block mt-1 w-44 rounded-lg border border-slate-400 bg-white dark:bg-slate-950 p-2"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="800,00"
              />
            </label>
            <button className="rounded-lg bg-emerald-700 text-white px-4 py-2" type="submit">
              Salvar limite
            </button>
          </form>
          {error && (
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}
          <p role="status" className="text-sm">
            {message}
          </p>
          {Object.keys(budgets).length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Defina um limite para acompanhar seus gastos neste mês.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.filter((name) => budgets[name] !== undefined).map((name) => {
              const limit = budgets[name]!;
              const used = spending[name] ?? 0;
              const remaining = (Math.round(limit * 100) - Math.round(used * 100)) / 100;
              return (
                <div
                  key={name}
                  className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm">{name}</strong>
                    <div className="flex gap-3 text-xs">
                      <button
                        type="button"
                        className="underline"
                        aria-label={`Editar limite de ${name}`}
                        onClick={() => {
                          setCategory(name);
                          setAmount(String(limit));
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="underline"
                        aria-label={`Remover limite de ${name}`}
                        onClick={() => {
                          const next = { ...budgets };
                          delete next[name];
                          persist(next);
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                  <p className="text-xs">
                    {money(used)} utilizados de {money(limit)}
                  </p>
                  <div
                    role="progressbar"
                    aria-label={`Orçamento de ${name}`}
                    aria-valuemin={0}
                    aria-valuemax={limit}
                    aria-valuenow={Math.min(used, limit)}
                    aria-valuetext={`${money(used)} utilizados de ${money(limit)}`}
                    className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                  >
                    <div
                      className={`h-full ${remaining < 0 ? 'bg-rose-600' : 'bg-emerald-600'}`}
                      style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                    />
                  </div>
                  <p
                    className={`text-xs ${remaining < 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-600 dark:text-slate-300'}`}
                  >
                    {remaining < 0
                      ? `Limite ultrapassado em ${money(-remaining)}`
                      : remaining === 0
                        ? 'Limite atingido.'
                        : `${money(remaining)} restantes`}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
