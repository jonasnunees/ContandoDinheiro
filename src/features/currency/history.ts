import type { Currency, History, Interval, Observation } from './types.ts';
import type { ReferenceCurrency } from './catalog.ts';
// Uma única data civil em São Paulo, independente do fuso do navegador.
export function dateKey(timestamp: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(timestamp);
}
export function historyInterval(months: 1 | 3 | 6, now = Date.now()): Interval {
  const today = dateKey(now);
  const [year, month, day] = today.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 - months, 1));
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return { start: target.toISOString().slice(0, 10), end: today };
}
export function parseTimestamp(value: unknown): number {
  // Chamadas reais dos endpoints usados retornaram segundos Unix, com 10 dígitos.
  if (typeof value !== 'string' || !/^\d{10}$/.test(value)) return NaN;
  const timestamp = Number(value) * 1000;
  return Number.isFinite(new Date(timestamp).getTime()) ? timestamp : NaN;
}
export function normalizeHistory(
  data: unknown,
  code: ReferenceCurrency,
  interval: Interval,
): History {
  if (!Array.isArray(data)) throw new Error('Resposta de histórico inválida.');
  const dates = new Map<string, Observation>();
  let invalid = 0;
  for (const row of data) {
    if (!row || typeof row !== 'object') {
      invalid++;
      continue;
    }
    const item = row as Record<string, unknown>;
    if (
      (item.code !== undefined && item.code !== code) ||
      (item.codein !== undefined && item.codein !== 'BRL')
    )
      throw new Error('Resposta de histórico inválida: par divergente.');
    const bid =
      typeof item.bid === 'string' && /^\d+(?:\.\d+)?$/.test(item.bid) ? Number(item.bid) : NaN;
    const timestamp = parseTimestamp(item.timestamp);
    if (!Number.isFinite(bid) || bid <= 0 || !Number.isFinite(timestamp)) {
      invalid++;
      continue;
    }
    const date = dateKey(timestamp);
    if (date < interval.start || date >= interval.end) continue;
    const previous = dates.get(date);
    // Última observação do dia; em empate, menor bid, independente da ordem.
    if (
      !previous ||
      timestamp > previous.timestamp ||
      (timestamp === previous.timestamp && bid < previous.bid)
    )
      dates.set(date, { date, bid, timestamp });
  }
  return {
    points: [...dates.values()].sort((a, b) => a.date.localeCompare(b.date)),
    invalid,
    fetchedAt: 0,
  };
}
export function crossHistory(
  from: Currency,
  to: Currency,
  histories: Partial<Record<ReferenceCurrency, History>>,
): Observation[] {
  if (from === to) return [];
  const source = from === 'BRL' ? histories[to as ReferenceCurrency] : histories[from];
  if (!source) return [];
  const target = to === 'BRL' ? undefined : new Map(histories[to]?.points.map((p) => [p.date, p]));
  return source.points.flatMap((p) => {
    const denominator = to === 'BRL' ? 1 : target?.get(p.date)?.bid;
    if (!denominator) return [];
    const bid = (from === 'BRL' ? 1 : p.bid) / denominator;
    return Number.isFinite(bid) && bid > 0 ? [{ ...p, bid }] : [];
  });
}
export function formatDate(date: string): string {
  return date.split('-').reverse().join('/');
}
