import { getSupabaseClient } from '../../services/supabase';

// Pede ao Supabase o endereço de autenticação do Google; a tela fará o redirecionamento.
export async function signInWithGoogleService(): Promise<{ error?: unknown; url?: string | null }> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    return { error, url: data?.url ?? null };
  }
  return { error: new Error('Supabase não configurado') };
}
