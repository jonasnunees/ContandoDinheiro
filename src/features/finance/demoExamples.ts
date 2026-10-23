import { materialize, monthlyDate } from './scheduling.ts';
import { localDate } from './validation.ts';
import type { Transaction, TransactionSeries, TransactionDraft } from './types.ts';

export const DEMO_EXAMPLES_VERSION = 2;
export interface DemoState {
  transactions: Transaction[];
  series: TransactionSeries[];
  examplesVersion?: number;
}

// Exemplos usam as mesmas regras de geração e edição dos lançamentos cadastrados.
export function createDemoExamples(today = localDate()): DemoState {
  const month = today.slice(0, 8);
  const template = (fields: Partial<TransactionDraft>): TransactionDraft => ({
    descricao: '',
    valor: 1,
    tipo: 'despesa',
    data: month + '10',
    forma_pagamento: 'Pix',
    status: 'pago',
    categoria: 'Serviços',
    ...fields,
  });
  const series: TransactionSeries[] = [
    {
      id: 'demo-series-internet',
      mode: 'monthly',
      next: 0,
      template: template({
        descricao: 'Internet residencial',
        valor: 149.9,
        data: monthlyDate(month + '10', -1),
        categoria: 'Moradia',
        forma_pagamento: 'Boleto',
      }),
    },
    {
      id: 'demo-series-aulas',
      mode: 'monthly',
      next: 0,
      template: template({
        descricao: 'Aulas particulares',
        valor: 450,
        tipo: 'receita',
        data: monthlyDate(month + '25', -1),
        categoria: 'Educação',
        forma_pagamento: 'Transferência',
      }),
    },
    {
      id: 'demo-series-academia',
      mode: 'monthly',
      next: 0,
      end: monthlyDate(month + '20', 3),
      template: template({
        descricao: 'Academia — plano com término',
        valor: 99.9,
        data: monthlyDate(month + '20', -1),
        categoria: 'Saúde',
        forma_pagamento: 'Cartão de Débito',
      }),
    },
    {
      id: 'demo-series-notebook',
      mode: 'installments',
      count: 10,
      next: 0,
      template: template({
        descricao: 'Notebook para trabalho',
        valor: 3499.9,
        data: monthlyDate(month + '15', -2),
        categoria: 'Outros',
        forma_pagamento: 'Cartão de Crédito',
      }),
    },
    {
      id: 'demo-series-curso',
      mode: 'installments',
      count: 6,
      next: 0,
      template: template({
        descricao: 'Curso de especialização',
        valor: 1299.99,
        data: monthlyDate(month + '28', -1),
        categoria: 'Educação',
        forma_pagamento: 'Cartão de Crédito',
      }),
    },
  ];
  const transactions = series
    .flatMap((item) => materialize(item, today))
    .map((row) => ({
      ...row,
      status: row.data < today ? ('pago' as const) : ('pendente' as const),
    }));
  return { transactions, series, examplesVersion: DEMO_EXAMPLES_VERSION };
}

// Acrescenta os novos exemplos uma vez. IDs estáveis evitam duplicação e não
// substituem os exemplos que a pessoa já editou. Listas esvaziadas ficam vazias.
export function upgradeDemoExamples(state: DemoState): DemoState {
  if ((state.examplesVersion ?? 0) >= DEMO_EXAMPLES_VERSION || state.transactions.length === 0)
    return state;
  const examples = createDemoExamples();
  const existingSeries = new Set(state.series.map((series) => series.id));
  const existingTransactions = new Set(state.transactions.map((row) => row.id));
  const additions = examples.series.filter((series) => !existingSeries.has(series.id));
  const addedIds = new Set(additions.map((series) => series.id));
  return {
    ...state,
    series: [...state.series, ...additions],
    transactions: [
      ...state.transactions,
      ...examples.transactions.filter(
        (row) => addedIds.has(row.serie_id!) && !existingTransactions.has(row.id),
      ),
    ],
  };
}
