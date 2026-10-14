import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../services/supabase';
import { observeSession, GUEST_USER, type AppUser } from './session';

export function useSession() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [sessionError, setSessionError] = useState('');
  const client = getSupabaseClient();
  useEffect(() => observeSession(client, setUser, setSessionError), [client]);
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
