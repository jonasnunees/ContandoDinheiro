import { assertCategory } from './categories';
import { matchesTransactionPeriod } from './calculations';
import { DEMO_EXAMPLES_VERSION } from './demoExamples';
import { materialize, editFollowing, validateSchedule } from './scheduling';
import { localDate, isTransaction } from './validation';
import { requireAuthenticatedClient } from '../../services/supabase';
import {
  getLocalTransactions,
  withDemoLock,
  saveLocalTransactions,
  getLocalState,
  saveLocalState,
} from './demoStorage';
import type {
  Transaction,
  TransactionDraft,
  TransactionUpdate,
  TransactionStatus,
  TransactionPeriod,
  ScheduleOptions,
  TransactionSeries,
} from './types';

// Falha antes de obter um cliente remoto se modo, identidade ou ID local
// forem encaminhados por engano para o caminho de uma conta real.
function assertTransactionContext(isDemo: boolean, userId?: string, id?: string) {
  if (typeof isDemo !== 'boolean') throw new Error('Modo de acesso inválido.');
  if (isDemo && userId && userId !== 'demo-user-id')
    throw new Error('A demonstração exige uma identidade local.');
  if (!isDemo && (userId === 'demo-user-id' || (id && /^(demo-|tx-)/.test(id)))) {
    throw new Error('Dados da demonstração não podem acessar o banco.');
  }
}

// Separa apenas os campos editáveis, evitando que a atualização troque o dono ou o ID.
function editableTransactionFields(input: TransactionUpdate) {
  const fields = [
    'descricao',
    'valor',
    'tipo',
    'data',
    'forma_pagamento',
    'status',
    'categoria',
    'categoria_id',
    'data_pagamento',
  ] as const;
  return Object.fromEntries(
    fields.filter((field) => input[field] !== undefined).map((field) => [field, input[field]]),
  );
}

// Contexto restrito à chamada: nunca é armazenado entre cargas ou contas.
type ReadContext = Awaited<ReturnType<typeof requireAuthenticatedClient>>;

async function prepareTransactionRead(userId: string): Promise<ReadContext> {
  const { client } = await requireAuthenticatedClient(userId);
  const { error } = await client.rpc('materialize_transaction_series');
  if (error) throw error;
  // Detecta troca de conta enquanto a materialização estava em andamento.
  const context = await requireAuthenticatedClient(userId);
  if (context.client !== client) throw new Error('A conexão mudou. Tente novamente.');
  return context;
}

function previousPeriod(period: TransactionPeriod): TransactionPeriod {
  return period.month === 0
    ? { month: 11, year: period.year - 1 }
    : { ...period, month: period.month - 1 };
}

// Prepara uma vez e lê período, pendências e, quando solicitado, mês anterior em paralelo.
export async function fetchTransactionLoadService(
  userId: string,
  isDemo: boolean,
  period: TransactionPeriod,
  pendingUntil: string,
  includePrevious = false,
): Promise<[Transaction[], Transaction[]]> {
  assertTransactionContext(isDemo, userId);
  if (isDemo) {
    const rows = await fetchTransactionsService(userId, true);
    return [
      rows.filter(
        (row) =>
          matchesTransactionPeriod(row, period) ||
          (includePrevious &&
            period.month !== -1 &&
            matchesTransactionPeriod(row, previousPeriod(period))),
      ),
      rows.filter(
        (row) => row.status === 'pendente' && row.tipo === 'despesa' && row.data <= pendingUntil,
      ),
    ];
  }
  const context = await prepareTransactionRead(userId);
  const [current, pending, previous] = await Promise.all([
    readTransactions(userId, false, period, undefined, context),
    readTransactions(userId, false, undefined, pendingUntil, context),
    includePrevious && period.month !== -1
      ? readTransactions(userId, false, previousPeriod(period), undefined, context)
      : Promise.resolve([]),
  ]);
  return [[...current, ...previous], pending];
}

// Busca lançamentos da conta confirmada; na demonstração, lê os exemplos locais.
export async function fetchTransactionsService(
  userId: string,
  isDemo: boolean,
  period?: TransactionPeriod,
  pendingUntil?: string,
): Promise<Transaction[]> {
  assertTransactionContext(isDemo, userId);
  const context = isDemo ? undefined : await prepareTransactionRead(userId);
  return readTransactions(userId, isDemo, period, pendingUntil, context);
}

// Privada: somente os pontos de entrada autenticados fornecem o contexto preparado.
async function readTransactions(
  userId: string,
  isDemo: boolean,
  period?: TransactionPeriod,
  pendingUntil?: string,
  context?: ReadContext,
): Promise<Transaction[]> {
  if (!isDemo) {
    if (!context) throw new Error('Leitura sem preparação.');
    const { client, user } = context;
    const result: Transaction[] = [];
    let offset = 0;
    // Busca em páginas e avança pela quantidade recebida, até não haver mais registros.
    while (true) {
      let query = client
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        // O ID desempata datas iguais para manter uma ordem consistente entre páginas.
        .order('data', { ascending: false })
        .order('id', { ascending: false });
      // Intervalo com início incluído e fim excluído: dispensa calcular o último dia
      // de cada mês e também funciona na passagem de dezembro para janeiro.
      if (pendingUntil)
        query = query.eq('status', 'pendente').eq('tipo', 'despesa').lte('data', pendingUntil);
      if (period) {
        const start =
          period.month === -1
            ? `${period.year}-01-01`
            : `${period.year}-${String(period.month + 1).padStart(2, '0')}-01`;
        const end =
          period.month === -1
            ? `${period.year + 1}-01-01`
            : localDate(new Date(period.year, period.month + 1, 1));
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
  return withDemoLock(() => {
    const state = getLocalState();
    let changed = (state.examplesVersion ?? 0) < DEMO_EXAMPLES_VERSION;
    if (changed) state.examplesVersion = DEMO_EXAMPLES_VERSION;
    for (const series of state.series) {
      const generated = materialize(series);
      if (generated.length) {
        state.transactions.push(...generated);
        changed = true;
      }
    }
    if (changed) saveLocalState(state);
    // Mantém o contrato da leitura remota: o período e o limite de pendências
    // também se aplicam à demonstração, antes de entregar os dados à interface.
    return state.transactions.filter(
      (transaction) =>
        (transaction.user_id === userId || userId === 'demo-user-id') &&
        (!period || matchesTransactionPeriod(transaction, period)) &&
        (!pendingUntil ||
          (transaction.status === 'pendente' &&
            transaction.tipo === 'despesa' &&
            transaction.data <= pendingUntil)),
    );
  });
}

// Cria um lançamento no banco ou na lista local, conforme o modo de acesso.
export async function addTransactionService(
  transactionData: TransactionDraft,
  isDemo: boolean,
  expectedUserId?: string,
): Promise<Transaction> {
  assertTransactionContext(isDemo, expectedUserId);
  if (!isDemo) {
    const { client, user } = await requireAuthenticatedClient(expectedUserId);
    // O proprietário vem da identidade confirmada, nunca dos campos do formulário.
    // O filtro do serviço complementa as políticas de acesso aplicadas pelo banco.
    const payload = { ...editableTransactionFields(transactionData), user_id: user.id };
    const { data, error } = await client.from('transacoes').insert([payload]).select().single();

    if (error) {
      throw error;
    }
    if (!isTransaction(data)) throw new Error('O servidor retornou uma transação inválida.');
    return data;
  }

  // Na demonstração, usa a lista salva neste navegador.
  return withDemoLock(() => {
    const newTx: Transaction = {
      ...editableTransactionFields(transactionData),
      ...transactionData,
      user_id: 'demo-user-id',
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      created_at: new Date().toISOString(),
    };

    const local = getLocalState();
    const c = assertCategory(
      local.categories!,
      transactionData.categoria_id,
      undefined,
      transactionData.categoria,
    );
    newTx.categoria = c.name;
    newTx.categoria_id = c.id;
    const list = local.transactions;
    list.unshift(newTx);
    saveLocalTransactions(list);
    return newTx;
  });
}

// Atualiza o lançamento pelo ID; no banco, também exige que pertença à conta atual.
export async function updateTransactionService(
  id: string,
  updates: TransactionUpdate,
  isDemo: boolean,
  expectedUserId?: string,
): Promise<Transaction> {
  assertTransactionContext(isDemo, expectedUserId, id);
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
      throw error;
    }
    if (!isTransaction(data)) throw new Error('O servidor retornou uma transação inválida.');
    return data;
  }

  // Na demonstração, usa a lista salva neste navegador.
  return withDemoLock(() => {
    const list = getLocalTransactions();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Transação não encontrada.');
    const updated = { ...list[index], ...editableTransactionFields(updates) };
    const c = assertCategory(
      getLocalState().categories!,
      updated.categoria_id,
      list[index].categoria_id,
      updated.categoria,
    );
    updated.categoria = c.name;
    list[index] = updated;
    saveLocalTransactions(list);
    return updated;
  });
}

// Exclui o lançamento no banco ou remove seu ID da lista da demonstração.
export async function deleteTransactionService(
  id: string,
  isDemo: boolean,
  expectedUserId?: string,
): Promise<void> {
  assertTransactionContext(isDemo, expectedUserId, id);
  if (!isDemo) {
    const { client, user } = await requireAuthenticatedClient(expectedUserId);
    const { error } = await client.from('transacoes').delete().eq('id', id).eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar do Supabase:', error);
      throw error;
    }
    return;
  }

  // Na demonstração, usa a lista salva neste navegador.
  return withDemoLock(() => {
    const list = getLocalTransactions().filter((t) => t.id !== id);
    saveLocalTransactions(list);
  });
}

// Alterna entre pago e pendente, reaproveitando o serviço de atualização.
export async function toggleStatusService(
  id: string,
  currentStatus: TransactionStatus,
  isDemo: boolean,
  expectedUserId?: string,
): Promise<TransactionStatus> {
  const nextStatus: TransactionStatus = currentStatus === 'pago' ? 'pendente' : 'pago';
  await updateTransactionService(
    id,
    { status: nextStatus, data_pagamento: nextStatus === 'pago' ? localDate() : null },
    isDemo,
    expectedUserId,
  );
  return nextStatus;
}

// Série e ocorrências são persistidas juntas; erros revertem a operação inteira.
export async function saveScheduledTransaction(
  draft: TransactionDraft,
  options: ScheduleOptions,
  isDemo: boolean,
  userId: string,
  id?: string,
): Promise<Transaction | null> {
  assertTransactionContext(isDemo, userId, id);
  validateSchedule(draft, options);
  if (!id && options.mode === 'single') {
    return addTransactionService(draft, isDemo, userId);
  }
  if (id && options.scope !== 'following' && !options.cancel) {
    return updateTransactionService(id, draft, isDemo, userId);
  }
  if (!isDemo) {
    const { client } = await requireAuthenticatedClient(userId);
    const { data, error } = await client.rpc('save_transaction_series_with_target', {
      draft: editableTransactionFields(draft),
      options,
      transaction_id: id ?? null,
    });
    if (error) throw error;
    if (data === null && options.cancel) return null;
    if (!isTransaction(data)) throw new Error('O servidor retornou um destino inválido.');
    return data;
  }
  return withDemoLock(() => {
    const state = getLocalState();
    let target: Transaction | null = null;
    const previous = state.transactions.find((row) => row.id === id);
    if (!options.cancel) {
      const c = assertCategory(
        state.categories!,
        draft.categoria_id,
        previous?.categoria_id,
        draft.categoria,
      );
      draft = { ...draft, categoria: c.name, categoria_id: c.id };
    }
    if (id) {
      const selected = state.transactions.find((row) => row.id === id);
      const series = state.series.find((row) => row.id === selected?.serie_id);
      if (!selected || !series) throw new Error('Série não encontrada.');
      state.transactions = editFollowing(
        state.transactions,
        series,
        selected,
        draft,
        options.cancel,
      );
      target = state.transactions.find((row) => row.id === id) ?? null;
    } else {
      const series: TransactionSeries = {
        id: crypto.randomUUID(),
        template: draft,
        mode: options.mode as TransactionSeries['mode'],
        count: options.count,
        end: options.end,
        next: 0,
      };
      state.series.push(series);
      const created = materialize(series);
      state.transactions.push(...created);
      target = created[0] ?? null;
    }
    saveLocalState(state);
    return target;
  });
}
