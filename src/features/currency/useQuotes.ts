import { useCallback, useEffect, useRef, useState } from 'react';
import { getQuotes } from './service';
import { requiredReferences } from './catalog';
import type { Currency, References } from './types';
export function useQuotes(from: Currency, to: Currency) {
  const key = requiredReferences(from, to).join(',');
  const [state, setState] = useState<{
    key: string;
    data?: References;
    loading: boolean;
    error: string;
  }>({ key, loading: false, error: '' });
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++version.current;
    if (from === to) return;
    setState((previous) => ({
      key,
      data: previous.key === key ? previous.data : undefined,
      loading: true,
      error: '',
    }));
    try {
      const data = await getQuotes(requiredReferences(from, to));
      if (id === version.current) setState({ key, data, loading: false, error: '' });
    } catch (error) {
      if (id === version.current)
        setState((previous) => ({
          ...previous,
          loading: false,
          error: error instanceof Error ? error.message : 'Não foi possível consultar a cotação.',
        }));
    }
  }, [from, to, key]);
  const invalidate = useCallback(() => {
    version.current++;
  }, []);
  useEffect(() => {
    void refresh();
    return invalidate;
  }, [refresh, invalidate]);
  return {
    ...(state.key === key ? state : { data: undefined, loading: from !== to, error: '' }),
    refresh,
  };
}
