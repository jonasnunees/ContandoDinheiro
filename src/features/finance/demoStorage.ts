import { initialCategories, categoryName, categoryKey } from './categories.ts';
import { createDemoExamples, upgradeDemoExamples, type DemoState } from './demoExamples';
import { localDate, isTransaction, isTransactionSeries } from './validation';
import { readStorage, writeStorage } from '../../services/storage';
import type { Transaction } from './types';
const STORAGE_KEYS = { LOCAL_TRANSACTIONS: 'gf_local_transactions' };

// Exemplos datados no mês em que este módulo é carregado. Não são dados de uma conta real.
const INITIAL_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user-id',
    descricao: 'Salário Mensal',
    valor: 6500.0,
    tipo: 'receita',
    data: localDate().slice(0, 8) + '05',
    forma_pagamento: 'Pix',
    status: 'pago',
    categoria: 'Salário',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    user_id: 'demo-user-id',
    descricao: 'Aluguel do Apartamento',
    valor: 1850.0,
    tipo: 'despesa',
    data: localDate().slice(0, 8) + '10',
    forma_pagamento: 'Boleto',
    status: 'pago',
    categoria: 'Moradia',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    user_id: 'demo-user-id',
    descricao: 'Supermercado Mensal',
    valor: 920.45,
    tipo: 'despesa',
    data: localDate().slice(0, 8) + '12',
    forma_pagamento: 'Cartão de Débito',
    status: 'pago',
    categoria: 'Alimentação',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    user_id: 'demo-user-id',
    descricao: 'Projeto Freelance Web',
    valor: 1400.0,
    tipo: 'receita',
    data: localDate().slice(0, 8) + '15',
    forma_pagamento: 'Pix',
    status: 'pago',
    categoria: 'Serviços',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-5',
    user_id: 'demo-user-id',
    descricao: 'Combustível Posto Ipiranga',
    valor: 260.0,
    tipo: 'despesa',
    data: localDate().slice(0, 8) + '18',
    forma_pagamento: 'Cartão de Crédito',
    status: 'pago',
    categoria: 'Transporte',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-6',
    user_id: 'demo-user-id',
    descricao: 'Fatura Cartão de Crédito',
    valor: 1140.8,
    tipo: 'despesa',
    data: localDate().slice(0, 8) + '22',
    forma_pagamento: 'Boleto',
    status: 'pendente',
    categoria: 'Outros',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-7',
    user_id: 'demo-user-id',
    descricao: 'Rendimento de Dividendos',
    valor: 235.5,
    tipo: 'receita',
    data: localDate().slice(0, 8) + '25',
    forma_pagamento: 'Transferência',
    status: 'pago',
    categoria: 'Investimentos',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-8',
    user_id: 'demo-user-id',
    descricao: 'Plano de Saúde e Farmácia',
    valor: 380.0,
    tipo: 'despesa',
    data: localDate().slice(0, 8) + '27',
    forma_pagamento: 'Pix',
    status: 'pendente',
    categoria: 'Saúde',
    created_at: new Date().toISOString(),
  },
];

// Copia os objetos para que alterações na lista não modifiquem os exemplos originais.
function demoTransactions(): Transaction[] {
  return INITIAL_DEMO_TRANSACTIONS.map((tx) => ({ ...tx }));
}

// Sem conteúdo salvo, oferece exemplos. Uma lista vazia salva continua vazia:
// excluir todos os lançamentos não deve recriar a demonstração.
// JSON inválido gera erro e permanece intacto para permitir recuperação.
function readLocalState(): DemoState {
  const raw = readStorage(STORAGE_KEYS.LOCAL_TRANSACTIONS);
  if (!raw) {
    const examples = createDemoExamples();
    // A versão só é confirmada quando a leitura inicial persiste os exemplos.
    return {
      ...examples,
      examplesVersion: undefined,
      transactions: [...demoTransactions(), ...examples.transactions],
    };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isTransaction))
      return upgradeDemoExamples({ transactions: parsed, series: [] });
    if (
      parsed &&
      typeof parsed === 'object' &&
      'transactions' in parsed &&
      'series' in parsed &&
      (!('examplesVersion' in parsed) ||
        (Number.isInteger(parsed.examplesVersion) && Number(parsed.examplesVersion) >= 0)) &&
      Array.isArray(parsed.transactions) &&
      parsed.transactions.every(isTransaction) &&
      Array.isArray(parsed.series) &&
      parsed.series.every(isTransactionSeries)
    ) {
      return upgradeDemoExamples(parsed as DemoState);
    }
  } catch {
    /* Preserva o conteúdo original para permitir recuperação. */
  }
  throw new Error(
    'Os dados da demonstração estão inválidos. O conteúdo salvo foi preservado; não foi substituído por exemplos.',
  );
}

// Expõe apenas os lançamentos para operações que não alteram a configuração das séries.
function upgradeCategories(state: DemoState): DemoState {
  const categories = state.categories ?? initialCategories();
  if (
    !Array.isArray(categories) ||
    categories.some(
      (c) =>
        !c ||
        typeof c.id !== 'string' ||
        c.user_id !== 'demo-user-id' ||
        typeof c.archived !== 'boolean' ||
        categoryName(c.name) !== c.name,
    ) ||
    new Set(categories.map((c) => c.id)).size !== categories.length ||
    new Set(categories.map((c) => categoryKey(c.name))).size !== categories.length
  )
    throw new Error('Categorias locais inválidas.');
  const link = <T extends { categoria: string; categoria_id?: string }>(row: T): T => {
    const c = row.categoria_id
      ? categories.find((c) => c.id === row.categoria_id)
      : categories.find((c) => c.name === row.categoria);
    if (!c) throw new Error('Referência de categoria local inválida.');
    return { ...row, categoria_id: c.id, categoria: c.name };
  };
  return {
    ...state,
    categories,
    transactions: state.transactions.map(link),
    series: state.series.map((s) => ({ ...s, template: link(s.template) })),
  };
}

export function getLocalState(): DemoState {
  return upgradeCategories(readLocalState());
}

export function getLocalTransactions(): Transaction[] {
  return getLocalState().transactions;
}
// A gravação usa as mesmas regras da leitura: uma alteração nunca deve salvar
// séries que a próxima abertura da demonstração rejeitaria.
export function saveLocalState(state: DemoState) {
  if (!state.transactions.every(isTransaction) || !state.series.every(isTransactionSeries))
    throw new Error('Dados de demonstração inválidos.');
  writeStorage(STORAGE_KEYS.LOCAL_TRANSACTIONS, JSON.stringify(upgradeCategories(state)));
}
export function saveLocalTransactions(transactions: Transaction[]) {
  if (!transactions.every(isTransaction)) throw new Error('Dados de demonstração inválidos.');
  saveLocalState({ ...getLocalState(), transactions });
}

// Serializa operações locais entre abas quando Web Locks está disponível.
// A decisão de validar e a gravação do único documento ficam no mesmo bloqueio.
export async function withDemoLock<T>(operation: () => T): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks)
    return navigator.locks.request('contandodinheiro-demo', operation);
  return operation();
}
