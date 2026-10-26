import { useCallback, useEffect, useRef, useState } from 'react';
import { requiredReferences } from './catalog';
import { crossHistory, historyInterval } from './history';
import { getHistory } from './historyService';
import type { Currency, History, Observation } from './types';
import type { ReferenceCurrency } from './catalog';
export function useHistory(from: Currency, to: Currency, months: 1 | 3 | 6) {
  const interval = historyInterval(months);
  const key = `${from}:${to}:${interval.start}:${interval.end}`;
  const [state, setState] = useState<{
    key: string;
    points?: Observation[];
    partial: boolean;
    fetchedAt?: number;
    loading: boolean;
    error: string;
  }>({ key, partial: false, loading: false, error: '' });
  const version = useRef(0);
  const { start, end } = interval;
  const refresh = useCallback(async () => {
    const id = ++version.current;
    if (from === to) return;
    setState((previous) => ({
      ...(previous.key === key ? previous : { key, partial: false }),
      loading: true,
      error: '',
    }));
    try {
      const codes = requiredReferences(from, to);
      const series = await Promise.all(codes.map((code) => getHistory(code, { start, end })));
      const histories: Partial<Record<ReferenceCurrency, History>> = {};
      codes.forEach((code, i) => {
        histories[code] = series[i];
      });
      const points = crossHistory(from, to, histories);
      const partial = series.some((s) => s.invalid > 0 || s.points.length !== points.length);
      if (id === version.current)
        setState({
          key,
          points,
          partial,
          fetchedAt: Math.min(...series.map((s) => s.fetchedAt)),
          loading: false,
          error: '',
        });
    } catch (error) {
      if (id === version.current)
        setState((previous) => ({
          ...previous,
          loading: false,
          error: error instanceof Error ? error.message : 'Não foi possível consultar o histórico.',
        }));
    }
  }, [from, to, start, end, key]);
  const invalidate = useCallback(() => {
    version.current++;
  }, []);
  useEffect(() => {
    void refresh();
    return invalidate;
  }, [refresh, invalidate]);
  return {
    ...(state.key === key
      ? state
      : {
          points: undefined,
          partial: false,
          loading: from !== to,
          error: '',
          fetchedAt: undefined,
        }),
    refresh,
  };
}
