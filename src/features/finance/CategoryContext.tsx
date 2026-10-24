import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppUser } from '../auth/session';
import type { UserCategory } from './types';
import { fetchCategories, createCategory, archiveCategory } from './categoriesService';
const Context = createContext<{
  categories: UserCategory[];
  error: string;
  reload: () => Promise<void>;
  create: (name: string) => Promise<void>;
  archive: (id: string, archived: boolean) => Promise<void>;
} | null>(null);
export function CategoryProvider({ user, children }: { user: AppUser; children: ReactNode }) {
  const [state, setState] = useState<{ key: string; categories: UserCategory[]; error: string }>({
    key: '',
    categories: [],
    error: '',
  });
  const key = `${user.id}:${user.isDemo}`;
  const current = useRef(key);
  current.current = key;
  const version = useRef(0);
  async function reload() {
    const request = ++version.current;
    try {
      const categories = await fetchCategories(user);
      if (current.current === key && request === version.current)
        setState({ key, categories, error: '' });
    } catch (e) {
      if (current.current === key && request === version.current)
        setState({
          key,
          categories: [],
          error: e instanceof Error ? e.message : 'Falha ao carregar categorias.',
        });
      throw e;
    }
  }
  useEffect(() => {
    void reload().catch(() => {});
    const generation = version;
    return () => {
      generation.current++;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Context.Provider
      value={{
        categories: state.key === key ? state.categories : [],
        error: state.key === key ? state.error : '',
        reload,
        create: async (name) => {
          await createCategory(user, name);
          await reload();
        },
        archive: async (id, archived) => {
          await archiveCategory(user, id, archived);
          await reload();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCategories() {
  const context = useContext(Context);
  if (!context) throw new Error('Categorias indisponíveis.');
  return context;
}
