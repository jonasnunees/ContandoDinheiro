import { CATEGORIES, PAYMENT_METHODS, type Transaction } from './types.ts';

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

// Confere os campos de dados recebidos antes de tratá-los como um lançamento válido.
// Os tipos do TypeScript ajudam durante o desenvolvimento, mas não verificam dados externos.
export function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false;
  const tx = value as Record<string, unknown>;
  const seriesValid = tx.serie_id == null
    ? tx.ocorrencia == null && tx.parcelas == null
    : typeof tx.serie_id === 'string' && Number.isInteger(tx.ocorrencia) && Number(tx.ocorrencia) >= 0 &&
      (tx.parcelas == null || Number.isInteger(tx.parcelas) && Number(tx.parcelas) >= 2 && Number(tx.parcelas) <= 360 && Number(tx.ocorrencia) < Number(tx.parcelas));
  const paidDate = tx.data_pagamento;
  const paymentValid = paidDate == null || (tx.status === 'pago' && typeof paidDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(paidDate) && !Number.isNaN(Date.parse(`${paidDate}T12:00:00Z`)) && new Date(`${paidDate}T12:00:00Z`).toISOString().slice(0, 10) === paidDate && paidDate <= localDate());
  return paymentValid && seriesValid && (tx.created_at === undefined || typeof tx.created_at === 'string') && typeof tx.id === 'string' && typeof tx.user_id === 'string' &&
    typeof tx.descricao === 'string' && tx.descricao.trim().length > 0 &&
    typeof tx.valor === 'number' && Number.isFinite(tx.valor) && tx.valor > 0 && tx.valor <= 9999999999.99 &&
    ['receita', 'despesa'].includes(String(tx.tipo)) && ['pago', 'pendente'].includes(String(tx.status)) &&
    typeof tx.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(tx.data) &&
    !Number.isNaN(Date.parse(`${tx.data}T12:00:00Z`)) && new Date(`${tx.data}T12:00:00Z`).toISOString().slice(0, 10) === tx.data &&
    PAYMENT_METHODS.some(method => method === tx.forma_pagamento) &&
    CATEGORIES.some(category => category === tx.categoria);
}
