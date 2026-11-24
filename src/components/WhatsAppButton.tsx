import React from 'react';

interface WhatsAppButtonProps {
  enabled: boolean;
  phoneNumber: string;
  label: string;
  message: string;
}

export function buildWhatsAppHref(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, '') || '525623373050';
  const text = encodeURIComponent(message.trim() || 'Qué tal, me gustaría informes sobre un inmueble.');
  return `https://wa.me/${digits}?text=${text}`;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  enabled,
  phoneNumber,
  label,
  message,
}) => {
  if (!enabled) return null;

  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) return null;

  const href = buildWhatsAppHref(digits, message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Contactar por ${label || 'WhatsApp'}`}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-lg border border-[#15803D] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16A34A]"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-4 h-4 fill-current shrink-0"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.79 14.12c-.24.68-1.41 1.3-1.95 1.38-.51.08-1.15.11-1.86-.11-.43-.14-.99-.32-1.7-.63-2.99-1.29-4.95-4.3-5.1-4.5-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.2 1.04-2.5.27-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.83 2.02.9 2.17.07.15.12.32.02.52-.1.2-.15.32-.3.49-.15.17-.31.38-.45.51-.15.15-.3.31-.13.61.17.3.77 1.27 1.65 2.05 1.13 1.01 2.09 1.32 2.39 1.47.3.15.47.13.65-.07.18-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.07.13.07.75-.17 1.43z" />
      </svg>
      <span>{label || 'WhatsApp'}</span>
    </a>
  );
};
