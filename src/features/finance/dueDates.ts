import { localDate } from './validation.ts';
import type { Transaction } from './types.ts';

export function upcomingLimit(today: string): string {
  const date = new Date(`${today}T12:00:00`);
  date.setDate(date.getDate() + 7);
  return localDate(date);
}
export function dueGroups(rows: Transaction[], today = localDate()) {
  const limit = upcomingLimit(today);
  const pending = rows.filter(t => t.tipo === 'despesa' && t.status === 'pendente' && t.data <= limit)
    .sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
  return [
    { title: 'Atrasadas', rows: pending.filter(t => t.data < today) },
    { title: 'Vencem hoje', rows: pending.filter(t => t.data === today) },
    { title: 'Próximos 7 dias', rows: pending.filter(t => t.data > today) },
  ];
}
export function overdueDays(due: string, today: string): number {
  return Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${due}T12:00:00Z`)) / 86400000);
}
