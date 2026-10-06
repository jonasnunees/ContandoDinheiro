import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  // Só exibe o aviso quando o navegador informa que está sem conexão.
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div role="status" className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/30 animate-pulse">
      <WifiOff className="w-4 h-4" />
      <span>Você está offline. A sincronização de transações da conta exige conexão.</span>
    </div>
  );
};
