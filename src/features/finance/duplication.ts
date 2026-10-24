import type { Transaction, TransactionDraft, UserCategory } from './types.ts';
import { isTransaction, localDate } from './validation.ts';

// Só os campos permitidos atravessam esta fronteira; identidade e metadados da série ficam fora.
export function duplicateTransactionDraft(
  source: Transaction,
  categories: UserCategory[],
  userId: string,
  now = new Date(),
): TransactionDraft {
  if (!isTransaction(source) || source.user_id !== userId)
    throw new Error('Lançamento indisponível para esta conta.');
  const category = categories.find(
    (c) =>
      c.user_id === userId &&
      !c.archived &&
      (source.categoria_id ? c.id === source.categoria_id : c.name === source.categoria),
  );
  return {
    descricao: source.descricao,
    valor: source.valor,
    tipo: source.tipo,
    categoria: category?.name ?? source.categoria,
    categoria_id: category?.id ?? '',
    forma_pagamento: source.forma_pagamento,
    data: localDate(now),
    status: 'pendente',
    data_pagamento: null,
  };
}
