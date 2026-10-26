import type { References } from './types.ts';
export const QUOTES_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL';
export function validateReferences(data: unknown): References {
  if (!data || typeof data !== 'object') throw new Error('Resposta de cotação inválida.');
  const result = {} as References;
  for (const code of ['USD', 'EUR'] as const) {
    const row = (data as Record<string, unknown>)[`${code}BRL`];
    if (!row || typeof row !== 'object') throw new Error('Resposta de cotação inválida.');
    const item = row as Record<string, unknown>;
    const bid =
      typeof item.bid === 'string' && /^\d+(?:\.\d+)?$/.test(item.bid) ? Number(item.bid) : NaN;
    const timestamp =
      typeof item.timestamp === 'string' && /^\d+$/.test(item.timestamp)
        ? Number(item.timestamp) * 1000
        : NaN;
    if (
      item.code !== code ||
      item.codein !== 'BRL' ||
      !Number.isFinite(bid) ||
      bid <= 0 ||
      !Number.isFinite(timestamp) ||
      timestamp <= 0 ||
      !Number.isFinite(new Date(timestamp).getTime())
    )
      throw new Error('Resposta de cotação inválida.');
    result[code] = { bid, timestamp };
  }
  return result;
}
// Apenas este serviço controla o cache; nenhuma cotação é persistida ou guardada pela PWA.
export function createQuoteService(
  fetcher: typeof fetch = fetch,
  now = Date.now,
  timeoutMs = 10000,
) {
  let cache: { data: References; fetchedAt: number } | undefined;
  let pending: Promise<References> | undefined;
  return function getQuotes(): Promise<References> {
    if (pending) return pending;
    if (cache && now() - cache.fetchedAt < 60000) return Promise.resolve(cache.data);
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetcher(QUOTES_URL, {
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
        const data = validateReferences(await response.json());
        cache = { data, fetchedAt: now() };
        return data;
      } catch (error) {
        if (controller.signal.aborted)
          throw new Error('A consulta demorou demais. Tente novamente.');
        if (error instanceof SyntaxError) throw new Error('Resposta de cotação inválida.');
        if (error instanceof TypeError)
          throw new Error('Não foi possível conectar. Verifique sua conexão e tente novamente.');
        throw error;
      } finally {
        clearTimeout(timer);
      }
    })().finally(() => {
      pending = undefined;
    });
    return pending;
  };
}
export const getQuotes = createQuoteService();
