import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC = () => {
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fadeDelay = prefersReducedMotion ? 200 : 850;
    const removeDelay = prefersReducedMotion ? 350 : 1250;

    const t1 = window.setTimeout(() => setFading(true), fadeDelay);
    const t2 = window.setTimeout(() => setDismissed(true), removeDelay);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (dismissed) return null;

  return (
    <div
      onClick={() => {
        setFading(true);
        window.setTimeout(() => setDismissed(true), 250);
      }}
      className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={fading}
    >
      <div className="flex flex-col items-center gap-6 max-w-xs w-full">
        <img
          src="/mujerlogo.png"
          alt="Mujer Inmobiliaria & Asociadas"
          referrerPolicy="no-referrer"
          className="w-56 sm:w-64 h-auto object-contain"
        />
        <div className="w-40 h-[2px] bg-[#E6E2E8] overflow-hidden">
          <div className="w-full h-full bg-[#892B84] animate-splash-progress" />
        </div>
      </div>
    </div>
  );
};
