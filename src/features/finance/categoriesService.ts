import { requireAuthenticatedClient } from '../../services/supabase';
import { getLocalState, saveLocalState, withDemoLock } from './demoStorage';
import { categoryName, categoryKey } from './categories';
import type { AppUser } from '../auth/session';
import type { UserCategory } from './types';
function check(user: AppUser) {
  if (user.isDemo !== (user.id === 'demo-user-id')) throw new Error('Identidade inválida.');
}
export async function fetchCategories(user: AppUser): Promise<UserCategory[]> {
  check(user);
  if (user.isDemo) return getLocalState().categories!;
  const { client } = await requireAuthenticatedClient(user.id);
  const { error: seedError } = await client.rpc('ensure_categories');
  if (seedError) throw seedError;
  const data: UserCategory[] = [];
  let offset = 0;
  while (true) {
    const { data: page, error } = await client
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
      .order('id')
      .range(offset, offset + 499);
    if (error) throw error;
    if (!Array.isArray(page)) throw new Error('Categorias inválidas.');
    if (!page.length) break;
    data.push(...page);
    offset += page.length;
  }
  await requireAuthenticatedClient(user.id);
  if (
    !Array.isArray(data) ||
    data.some(
      (c) =>
        c.user_id !== user.id ||
        typeof c.id !== 'string' ||
        typeof c.archived !== 'boolean' ||
        categoryName(c.name) !== c.name,
    )
  )
    throw new Error('Categorias inválidas.');
  return data;
}
export async function createCategory(user: AppUser, input: string) {
  check(user);
  const name = categoryName(input);
  if (user.isDemo) {
    await withDemoLock(() => {
      const state = getLocalState();
      if (state.categories!.some((c) => categoryKey(c.name) === categoryKey(name)))
        throw new Error('Já existe uma categoria com esse nome, inclusive entre as arquivadas.');
      state.categories!.push({ id: crypto.randomUUID(), user_id: user.id, name, archived: false });
      saveLocalState(state);
    });
  } else {
    const { client } = await requireAuthenticatedClient(user.id);
    const { error } = await client.from('categories').insert({ user_id: user.id, name });
    if (error)
      throw new Error(
        error.code === '23505'
          ? 'Já existe uma categoria com esse nome, inclusive entre as arquivadas.'
          : error.message,
      );
  }
}
export async function archiveCategory(user: AppUser, id: string, archived: boolean) {
  check(user);
  if (user.isDemo) {
    await withDemoLock(() => {
      const state = getLocalState();
      const c = state.categories!.find((c) => c.id === id);
      if (!c) throw new Error('Categoria não encontrada.');
      c.archived = archived;
      saveLocalState(state);
    });
  } else {
    const { client } = await requireAuthenticatedClient(user.id);
    const { error } = await client
      .from('categories')
      .update({ archived })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;
  }
}
