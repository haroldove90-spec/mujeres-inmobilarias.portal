import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-11 sm:h-12 w-auto' }) => {
  const [srcIndex, setSrcIndex] = useState(0);
  const sources = [
    '/mujerlogo.png',
    'https://daloocomercializadora.com.mx/mujerlogo.png',
  ];

  if (srcIndex >= sources.length) {
    return (
      <span className="font-editorial text-lg sm:text-xl font-semibold tracking-tight text-[#892B84] whitespace-nowrap">
        Mujer Inmobiliaria &amp; Asociadas
      </span>
    );
  }

  return (
    <img
      src={sources[srcIndex]}
      alt="Mujer Inmobiliaria & Asociadas"
      referrerPolicy="no-referrer"
      onError={() => setSrcIndex((prev) => prev + 1)}
      className={`${className} object-contain`}
    />
  );
};
