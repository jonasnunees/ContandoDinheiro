import { useEffect, useState } from 'react';

// Um hook reúne uma lógica reutilizável; este acompanha o sinal de conexão informado pelo navegador.
// Esse sinal não garante que o servidor esteja acessível.
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Remove os ouvintes de eventos quando o componente sai da tela.
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
