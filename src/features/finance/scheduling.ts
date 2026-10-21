import { localDate, isTransaction } from './validation.ts';
import type { Transaction, TransactionDraft, TransactionSeries, ScheduleOptions } from './types.ts';

// Usa sempre o dia original: 31/jan → 28/fev → 31/mar.
export function monthlyDate(anchor: string, offset: number): string {
  const [year, month, day] = anchor.split('-').map(Number);
  const date = new Date(0);
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year, month - 1 + offset, 1);
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  return localDate(date);
}

export function validateSchedule(draft: TransactionDraft, options: ScheduleOptions) {
  if (!isTransaction({ ...draft, id: 'draft', user_id: 'draft' })) throw new Error('Verifique o valor, a data e os campos do lançamento.');
  if (!['single', 'monthly', 'installments'].includes(options.mode)) throw new Error('Repetição inválida.');
  if (options.mode === 'installments' && (!Number.isInteger(options.count) || options.count! < 2 || options.count! > 360 || Math.round(draft.valor * 100) < options.count!)) {
    throw new Error('Informe de 2 a 360 parcelas, com pelo menos R$ 0,01 por parcela.');
  }
  if (options.end && (!isTransaction({ ...draft, data: options.end, id: 'draft', user_id: 'draft' }) || options.end < draft.data || options.end > monthlyDate(draft.data, 359))) {
    throw new Error('O término deve estar entre a primeira data e os próximos 30 anos.');
  }
}

export function materialize(series: TransactionSeries, today = localDate()): Transaction[] {
  const result: Transaction[] = [];
  const horizon = monthlyDate(today.slice(0, 8) + '01', 12);
  while (!series.cancelled && series.next < 120000) {
    const index = series.next;
    const date = monthlyDate(series.template.data, index - (series.base ?? 0));
    if (series.mode === 'installments' ? index >= series.count! : series.end ? date > series.end : date >= horizon && index > 0) break;
    const cents = Math.round(series.template.valor * 100);
    const value = series.mode === 'installments' ? (Math.floor(cents / series.count!) + (index < cents % series.count! ? 1 : 0)) / 100 : series.template.valor;
    result.push({ ...series.template, id: `${series.id}-${index}`, user_id: 'demo-user-id',
      serie_id: series.id, ocorrencia: index, parcelas: series.mode === 'installments' ? series.count : null,
      data_pagamento: index === 0 && date <= today && series.template.status === 'pago' ? series.template.data_pagamento : null,
      data: date, valor: value, status: index === 0 && date <= today ? series.template.status : 'pendente' });
    series.next++;
  }
  return result;
}

export function editFollowing(rows: Transaction[], series: TransactionSeries, selected: Transaction, updates: TransactionDraft, cancel = false): Transaction[] {
  const start = selected.ocorrencia!;
  if (cancel) series.cancelled = true;
  else {
    series.template = { ...updates, data: updates.data, status: 'pendente', data_pagamento: null };
    series.base = start;

  }
  return rows.flatMap(row => {
    if (row.serie_id !== series.id || row.ocorrencia! < start || row.status === 'pago') return [row];
    if (cancel) return [];
    return [{ ...row, ...updates, data: monthlyDate(updates.data, row.ocorrencia! - start), data_pagamento: null, status: 'pendente' as const }];
  });
}

export function occurrenceLabel(tx: Transaction): string {
  return tx.serie_id ? tx.parcelas ? `${tx.ocorrencia! + 1} de ${tx.parcelas}` : 'Mensal' : '';
}
