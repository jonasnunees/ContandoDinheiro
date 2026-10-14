import { localDate, isTransaction } from './validation';
import { requireAuthenticatedClient } from '../../services/supabase';
import { getLocalTransactions, saveLocalTransactions } from './demoStorage';
import type { Transaction, TransactionDraft, TransactionUpdate, TransactionStatus, TransactionPeriod } from './types';

// Separa apenas os campos editáveis, evitando que a atualização troque o dono ou o ID.
function editableTransactionFields(input: TransactionUpdate) {
  const fields = ['descricao', 'valor', 'tipo', 'data', 'forma_pagamento', 'status', 'categoria'] as const;
  return Object.fromEntries(fields.filter(field => input[field] !== undefined).map(field => [field, input[field]]));
}

// Busca lançamentos da conta confirmada; na demonstração, lê os exemplos locais.
export async function fetchTransactionsService(userId: string, isDemo: boolean, period?: TransactionPeriod): Promise<Transaction[]> {
  if (!isDemo) {
    const { client, user } = await requireAuthenticatedClient(userId);
    const result: Transaction[] = [];
    let offset = 0;
    // Busca em páginas e avança pela quantidade recebida, até não haver mais registros.
    while (true) {
      let query = client.from('transacoes').select('*').eq('user_id', user.id)
        // O ID desempata datas iguais para manter uma ordem consistente entre páginas.
        .order('data', { ascending: false }).order('id', { ascending: false });
      // Intervalo com início incluído e fim excluído: dispensa calcular o último dia
      // de cada mês e também funciona na passagem de dezembro para janeiro.
      if (period) {
        const start = period.month === -1 ? `${period.year}-01-01` : `${period.year}-${String(period.month + 1).padStart(2, '0')}-01`;
        const end = period.month === -1 ? `${period.year + 1}-01-01` : localDate(new Date(period.year, period.month + 1, 1));
        query = query.gte('data', start).lt('data', end);
      }
      const { data, error } = await query.range(offset, offset + 499);
      if (error) throw error;
      if (!data?.length) break;
      if (!data.every(isTransaction)) throw new Error('O servidor retornou transações inválidas.');
      result.push(...data);
      offset += data.length;
    }
    return result;
  }

  // Na demonstração, usa a lista salva neste navegador.
  return getLocalTransactions().filter(t => t.user_id === userId || userId === 'demo-user-id');
}

// Cria um lançamento no banco ou na lista local, conforme o modo de acesso.
export async function addTransactionService(
  transactionData: TransactionDraft,
  isDemo: boolean,
  expectedUserId?: string
): Promise<Transaction> {
  if (!isDemo) {
    const { client, user } = await requireAuthenticatedClient(expectedUserId);
    // O proprietário vem da identidade confirmada, nunca dos campos do formulário.
    // O filtro do serviço complementa as políticas de acesso aplicadas pelo banco.
    const payload = { ...editableTransactionFields(transactionData), user_id: user.id };
    const { data, error } = await client
      .from('transacoes')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir no Supabase:', error);
      throw error;
    }
    if (!isTransaction(data)) throw new Error('O servidor retornou uma transação inválida.');
    return data;
  }

  // Na demonstração, usa a lista salva neste navegador.
  const newTx: Transaction = {
    ...editableTransactionFields(transactionData),
    ...transactionData,
    user_id: 'demo-user-id',
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    created_at: new Date().toISOString(),
  };

  const list = getLocalTransactions();
  list.unshift(newTx);
  saveLocalTransactions(list);
  return newTx;
}

// Atualiza o lançamento pelo ID; no banco, também exige que pertença à conta atual.
export async function updateTransactionService(
  id: string,
  updates: TransactionUpdate,
  isDemo: boolean,
  expectedUserId?: string
): Promise<Transaction> {
  if (!isDemo) {
    const { client, user } = await requireAuthenticatedClient(expectedUserId);
    const { data, error } = await client
      .from('transacoes')
      .update(editableTransactionFields(updates))
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar no Supabase:', error);
      throw error;
    }
    if (!isTransaction(data)) throw new Error('O servidor retornou uma transação inválida.');
    return data;
  }

  // Na demonstração, usa a lista salva neste navegador.
  const list = getLocalTransactions();
  const index = list.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Transação não encontrada.');
  const updated = { ...list[index], ...editableTransactionFields(updates) };
  list[index] = updated;
  saveLocalTransactions(list);
  return updated;
}

// Exclui o lançamento no banco ou remove seu ID da lista da demonstração.
export async function deleteTransactionService(id: string, isDemo: boolean, expectedUserId?: string): Promise<void> {
  if (!isDemo) {
    const { client, user } = await requireAuthenticatedClient(expectedUserId);
    const { error } = await client
      .from('transacoes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar do Supabase:', error);
      throw error;
    }
    return;
  }

  // Na demonstração, usa a lista salva neste navegador.
  const list = getLocalTransactions().filter(t => t.id !== id);
  saveLocalTransactions(list);
}

// Alterna entre pago e pendente, reaproveitando o serviço de atualização.
export async function toggleStatusService(
  id: string,
  currentStatus: TransactionStatus,
  isDemo: boolean,
  expectedUserId?: string
): Promise<TransactionStatus> {
  const nextStatus: TransactionStatus = currentStatus === 'pago' ? 'pendente' : 'pago';
  await updateTransactionService(id, { status: nextStatus }, isDemo, expectedUserId);
  return nextStatus;
}
