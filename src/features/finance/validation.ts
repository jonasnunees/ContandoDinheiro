import { CATEGORIES, PAYMENT_METHODS, type Transaction, type TransactionSeries } from './types.ts';

// Monta a data no formato ano-mês-dia usando o horário local, sem mudar o dia por causa do fuso.
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Converte o valor digitado (como 1.234,56) em número e rejeita formatos inválidos.
export function parseMoney(input: string): number {
  const text = input.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text) && !/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error('Informe um valor válido, como 1234,56, com até duas casas decimais.');
  }
  // Remove os pontos de milhar e troca a vírgula decimal pelo ponto usado em cálculos.
  const normalized = text.includes(',') || /^\d{1,3}(?:\.\d{3})+$/.test(text)
    ? text.replace(/\./g, '').replace(',', '.') : text;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 9999999999.99) {
    throw new Error('Informe um valor maior que zero e de até R$ 9.999.999.999,99.');
  }
  return value;
}

// O JavaScript normaliza datas como 30/fev; a comparação de volta ao texto
// impede que essa correção automática aceite um vencimento inexistente.
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T12:00:00Z`);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function hasValidOccurrence(tx: Record<string, unknown>): boolean {
  if (tx.serie_id == null) return tx.ocorrencia == null && tx.parcelas == null;
  return typeof tx.serie_id === 'string' && Number.isInteger(tx.ocorrencia) && Number(tx.ocorrencia) >= 0 &&
    (tx.parcelas == null || Number.isInteger(tx.parcelas) && Number(tx.parcelas) >= 2 &&
      Number(tx.parcelas) <= 360 && Number(tx.ocorrencia) < Number(tx.parcelas));
}

// Pagamentos antigos podem não ter data conhecida. Uma data preenchida exige
// status pago e não pode apontar para o futuro no calendário local do usuário.
function hasValidPaymentDate(tx: Record<string, unknown>): boolean {
  return tx.data_pagamento == null ||
    (tx.status === 'pago' && isCalendarDate(tx.data_pagamento) && tx.data_pagamento <= localDate());
}

// Tipos estáticos não verificam JSON nem respostas do servidor: esta é a
// fronteira que transforma dados externos em lançamentos confiáveis.
export function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false;
  const tx = value as Record<string, unknown>;
  return hasValidPaymentDate(tx) && hasValidOccurrence(tx) &&
    (tx.created_at === undefined || typeof tx.created_at === 'string') &&
    typeof tx.id === 'string' && typeof tx.user_id === 'string' &&
    typeof tx.descricao === 'string' && tx.descricao.trim().length > 0 &&
    typeof tx.valor === 'number' && Number.isFinite(tx.valor) && tx.valor > 0 && tx.valor <= 9999999999.99 &&
    ['receita', 'despesa'].includes(String(tx.tipo)) && ['pago', 'pendente'].includes(String(tx.status)) &&
    isCalendarDate(tx.data) &&
    PAYMENT_METHODS.some(method => method === tx.forma_pagamento) &&
    CATEGORIES.some(category => category === tx.categoria);
}

// O estado salvo contém modelos de séries, além das ocorrências já geradas.
// Valida ambos antes de materializar para não propagar um JSON corrompido.
export function isTransactionSeries(value: unknown): value is TransactionSeries {
  if (!value || typeof value !== 'object') return false;
  const series = value as Record<string, unknown>;
  if (!series.template || typeof series.template !== 'object') return false;
  return typeof series.id === 'string' &&
    ['monthly', 'installments'].includes(String(series.mode)) &&
    Number.isInteger(series.next) && Number(series.next) >= 0 &&
    (series.base === undefined || Number.isInteger(series.base) && Number(series.base) >= 0) &&
    (series.mode !== 'installments' || Number.isInteger(series.count) && Number(series.count) >= 2 && Number(series.count) <= 360) &&
    (series.end === undefined || isCalendarDate(series.end)) &&
    (series.cancelled === undefined || typeof series.cancelled === 'boolean') &&
    isTransaction({ ...series.template, id: series.id, user_id: 'demo-user-id' });
}
