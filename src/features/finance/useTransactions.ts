import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppUser } from '../auth/session';
import type { Transaction, TransactionDraft, TransactionStatus, ScheduleOptions } from './types';
import { fetchTransactionsService, saveScheduledTransaction,
  deleteTransactionService, toggleStatusService } from './transactionsService';

// Coordena leitura, alterações e recarga dos lançamentos da conta e do período selecionados.
// Os serviços persistem os dados; este hook mantém a interface sincronizada com o resultado.
export function useTransactions(user: AppUser, month: number, year: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Cada leitura recebe uma versão. Só a mais recente pode atualizar a tela,
  // mesmo que uma requisição anterior termine depois dela.
  const version = useRef(0);
  const mounted = useRef(true);
  const key = `${user.id}:${user.isDemo}:${month}:${year}`;
  // A chave identifica conta, modo e período. A ref acompanha a seleção atual
  // para que callbacks antigos não publiquem dados de outra seleção.
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
  // A limpeza invalida respostas pendentes ao trocar o período ou desmontar a tela.
  // Isso ignora resultados antigos; não cancela a requisição já enviada ao servidor.
  useEffect(() => {
    mounted.current = true;
    void loadTransactions();
    return () => { mounted.current = false; invalidate(); };
  }, [loadTransactions, invalidate]);
  // Com ID, edita; sem ID, cria. Após cada alteração confirmada, relê a lista
  // para refletir a persistência e os filtros do período, sem atualização otimista.
  // Falhas de gravação são propagadas ao formulário; falhas de leitura viram loadError.
  const saveTransaction = async (data: TransactionDraft, id?: string, options: ScheduleOptions = { mode: 'single' }) => {
    await saveScheduledTransaction(data, options, user.isDemo, user.id, id);
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
