import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppUser } from '../auth/session';
import type { Transaction, TransactionDraft, TransactionStatus } from './types';
import { fetchTransactionsService, addTransactionService, updateTransactionService,
  deleteTransactionService, toggleStatusService } from './transactionsService';

export function useTransactions(user: AppUser, month: number, year: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const version = useRef(0);
  const mounted = useRef(true);
  const key = `${user.id}:${user.isDemo}:${month}:${year}`;
  const activeKey = useRef(key);
  activeKey.current = key;
  const invalidate = useCallback(() => { version.current++; }, []);
  const loadTransactions = useCallback(async () => {
    if (!mounted.current || activeKey.current !== key) return;
    const request = ++version.current;
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchTransactionsService(user.id, user.isDemo, { month, year });
      if (mounted.current && request === version.current && activeKey.current === key) setTransactions(data);
    } catch (error) {
      if (mounted.current && request === version.current && activeKey.current === key) {
        setLoadError(user.isDemo && error instanceof Error ? error.message :
          'Não foi possível carregar os lançamentos. Os valores exibidos podem estar desatualizados. Tente novamente.');
      }
    } finally {
      if (mounted.current && request === version.current && activeKey.current === key) {
        setLoading(false); setIsRefreshing(false);
      }
    }
  }, [key, user.id, user.isDemo, month, year]);
  useEffect(() => {
    mounted.current = true;
    void loadTransactions();
    return () => { mounted.current = false; invalidate(); };
  }, [loadTransactions, invalidate]);
  const saveTransaction = async (data: TransactionDraft, id?: string) => {
    if (id) await updateTransactionService(id, data, user.isDemo, user.id);
    else await addTransactionService(data, user.isDemo, user.id);
    await loadTransactions();
  };
  const deleteTransaction = async (id: string) => {
    await deleteTransactionService(id, user.isDemo, user.id);
    await loadTransactions();
  };
  const toggleStatus = async (id: string, status: TransactionStatus) => {
    await toggleStatusService(id, status, user.isDemo, user.id);
    await loadTransactions();
  };
  const refresh = async () => { setIsRefreshing(true); await loadTransactions(); };
  return { transactions, loading, loadError, isRefreshing, saveTransaction, deleteTransaction, toggleStatus, refresh };
}
