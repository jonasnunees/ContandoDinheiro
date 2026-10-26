import type { References } from './types.ts';
import type { ReferenceCurrency } from './catalog.ts';
import { parseTimestamp } from './history.ts';
export const API_BASE = 'https://economia.awesomeapi.com.br';
export const QUOTES_URL = `${API_BASE}/json/last/USD-BRL,EUR-BRL`;
export function validateReferences(
  data: unknown,
  codes: readonly ReferenceCurrency[] = ['USD', 'EUR'],
): References {
  if (!data || typeof data !== 'object') throw new Error('Resposta de cotação inválida.');
  const result: References = {};
  for (const code of codes) {
    const row = (data as Record<string, unknown>)[`${code}BRL`];
    if (!row || typeof row !== 'object') throw new Error('Resposta de cotação inválida.');
    const item = row as Record<string, unknown>;
    const bid =
      typeof item.bid === 'string' && /^\d+(?:\.\d+)?$/.test(item.bid) ? Number(item.bid) : NaN;
    const timestamp = parseTimestamp(item.timestamp);
    if (
      item.code !== code ||
      item.codein !== 'BRL' ||
      !Number.isFinite(bid) ||
      bid <= 0 ||
      !Number.isFinite(timestamp)
    )
      throw new Error('Resposta de cotação inválida.');
    result[code] = { bid, timestamp };
  }
  return result;
}
export async function fetchCurrency(
  url: string,
  fetcher: typeof fetch,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
    });
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? 'Limite de consultas atingido. Tente novamente em instantes.'
          : 'Serviço de câmbio indisponível. Tente novamente.',
      );
    return await response.json();
  } catch (error) {
    if (controller.signal.aborted) throw new Error('A consulta demorou demais. Tente novamente.');
    if (error instanceof SyntaxError) throw new Error('Resposta de cotação inválida.');
    if (error instanceof TypeError)
      throw new Error('Não foi possível conectar. Verifique sua conexão e tente novamente.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export function createQuoteService(
  fetcher: typeof fetch = fetch,
  now = Date.now,
  timeoutMs = 10000,
) {
  const cache = new Map<string, { data: References; fetchedAt: number }>();
  const pending = new Map<string, Promise<References>>();
  return function getQuotes(
    codes: readonly ReferenceCurrency[] = ['USD', 'EUR'],
  ): Promise<References> {
    const sorted = [...new Set(codes)].sort();
    if (!sorted.length) return Promise.resolve({});
    const key = sorted.join(',');
    const active = pending.get(key);
    if (active) return active;
    const cached = cache.get(key);
    if (cached && now() - cached.fetchedAt < 60000) return Promise.resolve(cached.data);
    const request = fetchCurrency(
      `${API_BASE}/json/last/${sorted.map((c) => `${c}-BRL`).join(',')}`,
      fetcher,
      timeoutMs,
    )
      .then((raw) => {
        const data = validateReferences(raw, sorted);
        if (cache.size >= 32) cache.delete(cache.keys().next().value!);
        cache.set(key, { data, fetchedAt: now() });
        return data;
      })
      .finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
export const getQuotes = createQuoteService();
