export function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writeStorage(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {
    throw new Error('Não foi possível salvar neste navegador. Verifique o espaço disponível e as permissões de armazenamento.');
  }
}
