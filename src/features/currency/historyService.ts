import type { ReferenceCurrency } from './catalog.ts';
import type { History, Interval } from './types.ts';
import { normalizeHistory } from './history.ts';
import { API_BASE, fetchCurrency } from './service.ts';
export function createHistoryService(
  fetcher: typeof fetch = fetch,
  now = Date.now,
  timeoutMs = 10000,
) {
  const cache = new Map<string, { code: ReferenceCurrency; interval: Interval; data: History }>();
  const pending = new Map<string, Promise<History>>();
  return function getHistory(code: ReferenceCurrency, interval: Interval): Promise<History> {
    for (const entry of cache.values()) {
      if (
        entry.code === code &&
        entry.interval.start <= interval.start &&
        entry.interval.end >= interval.end &&
        now() - entry.data.fetchedAt < 3600000
      )
        return Promise.resolve({
          ...entry.data,
          points: entry.data.points.filter(
            (p) => p.date >= interval.start && p.date < interval.end,
          ),
        });
    }
    const key = `${code}:${interval.start}:${interval.end}`;
    const active = pending.get(key);
    if (active) return active;
    const query = `start_date=${interval.start.replaceAll('-', '')}&end_date=${interval.end.replaceAll('-', '')}`;
    const request = fetchCurrency(
      `${API_BASE}/json/daily/${code}-BRL/360?${query}`,
      fetcher,
      timeoutMs,
    )
      .then((raw) => {
        const data = { ...normalizeHistory(raw, code, interval), fetchedAt: now() };
        if (cache.size >= 32) cache.delete(cache.keys().next().value!);
        cache.set(key, { code, interval, data });
        return data;
      })
      .finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
export const getHistory = createHistoryService();
