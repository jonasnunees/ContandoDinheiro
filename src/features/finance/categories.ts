import { CATEGORIES, type UserCategory } from './types.ts';
export const CATEGORY_NAME_LIMIT = 60;
// ASCII case folding is identical in PostgreSQL and JS, independent of locale.
export function categoryKey(name: string) {
  return name.replace(/[A-Z]/g, (c) => c.toLowerCase());
}
export function categoryName(value: string) {
  const name = value.trim();
  if (!name || [...name].length > CATEGORY_NAME_LIMIT)
    throw new Error('Informe um nome de 1 a 60 caracteres.');
  return name;
}
export function initialCategories(): UserCategory[] {
  return CATEGORIES.map((name, i) => ({
    id: `demo-category-${i}`,
    name,
    user_id: 'demo-user-id',
    archived: false,
  }));
}
export function assertCategory(
  categories: UserCategory[],
  id: string | undefined,
  previous?: string,
  legacyName?: string,
) {
  const category = categories.find((c) => (id ? c.id === id : c.name === legacyName));
  if (!category || (category.archived && category.id !== previous))
    throw new Error('Escolha uma categoria ativa. A categoria pode ter sido arquivada.');
  return category;
}
