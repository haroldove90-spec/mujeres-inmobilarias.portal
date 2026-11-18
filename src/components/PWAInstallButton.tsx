import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'inline' | 'drawer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'inline' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Hide when running already inside standalone installed PWA
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === 'drawer'
            ? 'w-full py-2.5 px-4 border border-[#892B84] text-[#892B84] text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#892B84]/5 transition-colors cursor-pointer whitespace-nowrap'
            : 'inline-flex items-center justify-center gap-2 px-4 py-3 border border-[#892B84]/40 bg-white text-[#892B84] text-xs font-semibold hover:border-[#892B84] hover:bg-[#892B84]/5 transition-colors whitespace-nowrap shrink-0 cursor-pointer'
        }
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161513]/65 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white border border-[#E6E2E8] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/mujericono.png"
                  alt="Icono Mujer Inmobiliaria"
                  className="w-11 h-11 object-contain border border-[#E6E2E8] bg-white p-1"
                />
                <div>
                  <h3 id="pwa-guide-title" className="text-xl font-medium text-[#161513]">
                    Instalar Mujer Inmobiliaria
                  </h3>
                  <p className="text-xs text-[#57534E]">Acceso directo desde tu pantalla de inicio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Cerrar instrucciones de instalación"
                className="w-8 h-8 inline-flex items-center justify-center border border-[#E6E2E8] text-[#161513] hover:bg-[#F9F8FA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-sm text-[#44403C] border-t border-b border-[#E6E2E8] py-4">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#892B84] mt-0.5">01.</span>
                  <span>
                    Toca el botón <strong className="inline-flex items-center gap-1">Compartir <Share className="w-3.5 h-3.5 text-[#892B84]" /></strong> en la barra de Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#892B84] mt-0.5">02.</span>
                  <span>
                    Desliza hacia abajo y selecciona <strong>Agregar a inicio</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#892B84] mt-0.5">03.</span>
                  <span>
                    Confirma pulsando <strong>Agregar</strong> en la esquina superior derecha.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-sm text-[#44403C] border-t border-b border-[#E6E2E8] py-4">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#892B84] mt-0.5">01.</span>
                  <span>
                    Abre el portal en una pestaña directa de <strong>Chrome, Edge o Safari</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#892B84] mt-0.5">02.</span>
                  <span>
                    Pulsa el ícono <strong>Instalar aplicación</strong> en la barra de direcciones o en el menú del navegador.
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 px-4 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
