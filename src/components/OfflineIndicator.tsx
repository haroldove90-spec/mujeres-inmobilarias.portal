import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-[#161513] text-white border border-[#892B84] px-3.5 py-2 text-xs font-medium shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#D88FD4]" />
      <span>Modo sin conexión — Mostrando contenido en caché</span>
    </div>
  );
};
