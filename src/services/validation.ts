import type { Transaction } from '../types/finance';

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseMoney(input: string): number {
  const text = input.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text) && !/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error('Informe um valor válido, como 1234,56, com até duas casas decimais.');
  }
  const normalized = text.includes(',') || /^\d{1,3}(?:\.\d{3})+$/.test(text)
    ? text.replace(/\./g, '').replace(',', '.') : text;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 9999999999.99) {
    throw new Error('Informe um valor maior que zero e de até R$ 9.999.999.999,99.');
  }
  return value;
}

export function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false;
  const tx = value as Record<string, unknown>;
  return typeof tx.id === 'string' && typeof tx.user_id === 'string' &&
    typeof tx.descricao === 'string' && tx.descricao.trim().length > 0 &&
    typeof tx.valor === 'number' && Number.isFinite(tx.valor) && tx.valor >= 0 && tx.valor <= 9999999999.99 &&
    ['receita', 'despesa'].includes(String(tx.tipo)) && ['pago', 'pendente'].includes(String(tx.status)) &&
    typeof tx.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(tx.data) &&
    !Number.isNaN(Date.parse(`${tx.data}T12:00:00Z`)) && new Date(`${tx.data}T12:00:00Z`).toISOString().slice(0, 10) === tx.data &&
    ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro'].includes(String(tx.forma_pagamento)) &&
    ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Salário', 'Investimentos', 'Serviços', 'Outros'].includes(String(tx.categoria));
}
