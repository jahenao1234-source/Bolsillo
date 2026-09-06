import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <aside
      aria-label="Aviso de conexión sin internet"
      className="fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center gap-2 rounded-xl bg-[var(--superficie)] border border-[var(--alerta)]/40 px-3.5 py-2 text-xs font-medium text-[color:var(--texto)] shadow-xl"
    >
      <span className="p-1 rounded-md bg-[var(--alerta)]/20 text-[color:var(--alerta)]">
        <WifiOff className="w-3.5 h-3.5" />
      </span>
      <span>Sin conexión &bull; Operando en modo local</span>
    </aside>
  );
};
