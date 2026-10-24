import { type Category, type Transaction } from './types';
import { groupTransactionValues, matchesTransactionPeriod } from './calculations';
import { readStorage, writeStorage } from '../../services/storage';

export type Budgets = Partial<Record<Category, number>>;

export function budgetStorageKey(userId: string, month: number, year: number, isDemo: boolean) {
  return `gf_budgets_v1:${isDemo ? 'demo' : 'account'}:${userId}:${year}:${month + 1}`;
}

export function readBudgets(key: string): Budgets {
  const raw = readStorage(key);
  if (raw === null) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const entries = Object.entries(value);
      if (
        entries.every(
          ([category, limit]) =>
            category.trim().length > 0 &&
            typeof limit === 'number' &&
            Number.isSafeInteger(Math.round(limit * 100)) &&
            limit > 0,
        )
      )
        return value as Budgets;
    }
  } catch {
    /* Preserva os dados inválidos para recuperação. */
  }
  throw new Error('Não foi possível ler os orçamentos salvos neste navegador.');
}

export function saveBudgets(key: string, budgets: Budgets) {
  writeStorage(key, JSON.stringify(budgets));
}

export function monthlySpending(transactions: Transaction[], month: number, year: number) {
  return groupTransactionValues(
    transactions.filter(
      (tx) =>
        tx.tipo === 'despesa' &&
        tx.status === 'pago' &&
        matchesTransactionPeriod(tx, { month, year }),
    ),
    'categoria',
  );
}
