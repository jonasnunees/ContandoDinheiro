import type { SupabaseClient } from '@supabase/supabase-js';

// Identidade usada pela interface. A demonstração é local, sem conta autenticada no banco.
export interface AppUser { id: string; email: string; isDemo: boolean }
export const GUEST_USER: AppUser = { id: 'demo-user-id', email: 'demo@exemplo.com', isDemo: true };

// Eventos repetidos da mesma conta não desmontam a interface. Uma troca real
// oculta a conta anterior imediatamente, antes da confirmação no servidor.
export function observeSession(
  client: SupabaseClient | null,
  onUser: (user: AppUser | null) => void,
  onError: (message: string) => void,
) {
  let current: AppUser | null = null;
  // Descarta confirmações atrasadas quando um novo evento de sessão chega.
  let version = 0;
  let disposed = false;
  // null significa confirmação em andamento; GUEST_USER libera a demonstração.
  const apply = (next: AppUser | null) => {
    if (disposed) return;
    if (current?.id === next?.id && current?.isDemo === next?.isDemo && current?.email === next?.email) return;
    current = next;
    onUser(next);
  };
  if (!client) {
    apply(GUEST_USER);
    return () => { disposed = true; };
  }
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    if (disposed) return;
    const request = ++version;
    onError('');
    if (!session?.user) { apply(GUEST_USER); return; }
    // A renovação da mesma conta preserva a tela. Outra conta passa pelo carregamento,
    // evitando que os lançamentos da anterior fiquem visíveis durante a confirmação.
    const sameAccount = current?.id === session.user.id && !current.isDemo;
    if (!sameAccount) apply(null);
    // Evita chamar outra operação de auth dentro do callback do Supabase.
    setTimeout(() => {
      if (disposed || request !== version) return;
      void client.auth.getUser().then(({ data, error }) => {
        if (disposed || request !== version) return;
        if (error) {
          if (!sameAccount) apply(GUEST_USER);
          onError('Não foi possível confirmar sua sessão. Verifique a conexão e tente novamente.');
          return;
        }
        if (!data.user || data.user.id !== session.user.id) { apply(GUEST_USER); return; }
        apply({ id: data.user.id, email: data.user.email || '', isDemo: false });
      }).catch(() => {
        if (disposed || request !== version) return;
        if (!sameAccount) apply(GUEST_USER);
        onError('Não foi possível confirmar sua sessão. Verifique a conexão e tente novamente.');
      });
    }, 0);
  });
  // Para de observar e impede que promessas/timers pendentes atualizem uma tela desmontada.
  return () => { disposed = true; version++; subscription.unsubscribe(); };
}
