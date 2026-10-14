import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../services/supabase';
import { observeSession, GUEST_USER, type AppUser } from './session';

// Conecta o observador de autenticação ao React e expõe os erros para a tela.
// O efeito devolve a limpeza de observeSession para encerrar a assinatura ao desmontar.
export function useSession() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [sessionError, setSessionError] = useState('');
  const client = getSupabaseClient();
  useEffect(() => observeSession(client, setUser, setSessionError), [client]);
  // Só muda para convidado após a saída bem-sucedida; em caso de falha,
  // mantém a identidade atual e mostra a mensagem para permitir nova tentativa.
  const logout = async () => {
    try {
      if (client) {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      }
      setUser(GUEST_USER);
      setSessionError('');
    } catch {
      setSessionError('Não foi possível sair da conta. Tente novamente.');
    }
  };
  return { user, sessionError, logout };
}
