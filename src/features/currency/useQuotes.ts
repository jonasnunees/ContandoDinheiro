import { useCallback, useEffect, useRef, useState } from 'react';
import { getQuotes } from './service';
import type { References } from './types';
export function useQuotes(enabled: boolean) {
  const [data, setData] = useState<References>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++version.current;
    setLoading(true);
    setError('');
    try {
      const next = await getQuotes();
      if (id === version.current) setData(next);
    } catch (error) {
      if (id === version.current)
        setError(error instanceof Error ? error.message : 'Não foi possível consultar a cotação.');
    } finally {
      if (id === version.current) setLoading(false);
    }
  }, []);
  const invalidate = useCallback(() => {
    version.current++;
  }, []);
  useEffect(() => {
    if (enabled) void refresh();
    return invalidate;
  }, [enabled, refresh, invalidate]);
  return { data, loading, error, refresh };
}
