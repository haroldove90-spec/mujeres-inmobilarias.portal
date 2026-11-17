import React from 'react';

export type LogoSurface = 'light' | 'dark' | 'forest';
export type LogoLayout = 'horizontal' | 'vertical' | 'monogram';

interface BrandMarkProps {
  className?: string;
  strokeColor?: string;
  accentColor?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  className = 'w-8 h-8',
  strokeColor = '#161513',
  accentColor = '#9A7B3E',
}) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Architectural horizon baseline */}
      <line x1="8" y1="52" x2="56" y2="52" stroke={strokeColor} strokeWidth="1.75" strokeLinecap="square" />

      {/* Left & right interlocking arches forming the "M" portal */}
      <path
        d="M13 52V25C13 17.8203 18.8203 12 26 12C29.4 12 32 14.2 32 18.5V37"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M51 52V25C51 17.8203 45.1797 12 38 12C34.6 12 32 14.2 32 18.5"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />

      {/* Inner architectural doorway chevron */}
      <path
        d="M22 52V35L32 25L42 35V52"
        stroke={strokeColor}
        strokeWidth="1.35"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Central keystone diamond */}
      <path
        d="M32 7L35.5 10.5L32 14L28.5 10.5L32 7Z"
        fill={accentColor}
      />

      {/* Subtle inner plumb point */}
      <circle cx="32" cy="43" r="1.5" fill={accentColor} />
    </svg>
  );
};

interface BrandLockupProps {
  layout?: LogoLayout;
  surface?: LogoSurface;
  className?: string;
}

export const BrandLockup: React.FC<BrandLockupProps> = ({
  layout = 'horizontal',
  surface = 'light',
  className = '',
}) => {
  const palette = {
    light: {
      primary: '#161513',
      secondary: '#57534E',
      accent: '#9A7B3E',
    },
    dark: {
      primary: '#F9F8F6',
      secondary: '#A8A29E',
      accent: '#D4B475',
    },
    forest: {
      primary: '#F9F8F6',
      secondary: '#C7D3CC',
      accent: '#D4B475',
    },
  }[surface];

  if (layout === 'monogram') {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${className}`}>
        <div
          className="p-5 border"
          style={{ borderColor: surface === 'light' ? 'rgba(22,21,19,0.16)' : 'rgba(249,248,246,0.22)' }}
        >
          <BrandMark
            className="w-20 h-20"
            strokeColor={palette.primary}
            accentColor={palette.accent}
          />
        </div>
        <span
          className="mt-3 text-[11px] uppercase tracking-[0.28em] font-medium"
          style={{ color: palette.secondary }}
        >
          M · I · A
        </span>
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={`inline-flex flex-col items-center text-center ${className}`}>
        <BrandMark
          className="w-16 h-16 mb-4"
          strokeColor={palette.primary}
          accentColor={palette.accent}
        />
        <span
          className="font-editorial text-2xl sm:text-3xl font-semibold tracking-tight leading-none"
          style={{ color: palette.primary }}
        >
          Mujer Inmobiliaria
        </span>
        <span
          className="mt-1.5 text-xs uppercase tracking-[0.26em] font-medium"
          style={{ color: palette.accent }}
        >
          &amp; Asociadas
        </span>
        <span
          className="mt-2.5 text-[10px] uppercase tracking-[0.2em]"
          style={{ color: palette.secondary }}
        >
          Patrimonio · Arquitectura · Certeza
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 sm:gap-4 max-w-full ${className}`}>
      <BrandMark
        className="w-9 h-9 sm:w-12 sm:h-12 shrink-0"
        strokeColor={palette.primary}
        accentColor={palette.accent}
      />
      <div className="flex flex-col text-left min-w-0">
        <span
          className="font-editorial text-lg sm:text-2xl md:text-[26px] font-semibold tracking-tight leading-tight"
          style={{ color: palette.primary }}
        >
          Mujer Inmobiliaria &amp; Asociadas
        </span>
        <span
          className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.24em] font-medium"
          style={{ color: palette.secondary }}
        >
          Asesoría Patrimonial Inmobiliaria
        </span>
      </div>
    </div>
  );
};

export function generateStandaloneLogoSvg(layout: LogoLayout, surface: LogoSurface): string {
  const colors = {
    light: { bg: '#F9F8F6', stroke: '#161513', sub: '#57534E', accent: '#9A7B3E' },
    dark: { bg: '#161513', stroke: '#F9F8F6', sub: '#A8A29E', accent: '#D4B475' },
    forest: { bg: '#1B4332', stroke: '#F9F8F6', sub: '#C7D3CC', accent: '#D4B475' },
  }[surface];

  const markPaths = `
    <line x1="8" y1="52" x2="56" y2="52" stroke="${colors.stroke}" stroke-width="1.75" stroke-linecap="square" />
    <path d="M13 52V25C13 17.8203 18.8203 12 26 12C29.4 12 32 14.2 32 18.5V37" stroke="${colors.stroke}" stroke-width="2" stroke-linecap="square" stroke-linejoin="round" fill="none" />
    <path d="M51 52V25C51 17.8203 45.1797 12 38 12C34.6 12 32 14.2 32 18.5" stroke="${colors.stroke}" stroke-width="2" stroke-linecap="square" stroke-linejoin="round" fill="none" />
    <path d="M22 52V35L32 25L42 35V52" stroke="${colors.stroke}" stroke-width="1.35" stroke-linecap="square" stroke-linejoin="miter" fill="none" />
    <path d="M32 7L35.5 10.5L32 14L28.5 10.5L32 7Z" fill="${colors.accent}" />
    <circle cx="32" cy="43" r="1.5" fill="${colors.accent}" />
  `;

  if (layout === 'monogram') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="320" height="320">
  <rect width="160" height="160" fill="${colors.bg}" />
  <rect x="20" y="16" width="120" height="110" fill="none" stroke="${colors.stroke}" stroke-opacity="0.2" stroke-width="1" />
  <g transform="translate(48, 34) scale(1.0)">
    ${markPaths}
  </g>
  <text x="80" y="144" text-anchor="middle" font-family="sans-serif" font-size="9" letter-spacing="4" fill="${colors.sub}">M · I · A</text>
</svg>`;
  }

  if (layout === 'vertical') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" width="720" height="440">
  <rect width="360" height="220" fill="${colors.bg}" />
  <g transform="translate(148, 28)">
    ${markPaths}
  </g>
  <text x="180" y="128" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="600" fill="${colors.stroke}">Mujer Inmobiliaria</text>
  <text x="180" y="152" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="600" letter-spacing="4" fill="${colors.accent}">&amp; ASOCIADAS</text>
  <text x="180" y="180" text-anchor="middle" font-family="sans-serif" font-size="8.5" letter-spacing="2.8" fill="${colors.sub}">PATRIMONIO · ARQUITECTURA · CERTEZA</text>
</svg>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 112" width="960" height="224">
  <rect width="480" height="112" fill="${colors.bg}" />
  <g transform="translate(24, 24)">
    ${markPaths}
  </g>
  <text x="108" y="56" font-family="Georgia, serif" font-size="25" font-weight="600" fill="${colors.stroke}">Mujer Inmobiliaria &amp; Asociadas</text>
  <text x="108" y="78" font-family="sans-serif" font-size="9.5" font-weight="500" letter-spacing="3.2" fill="${colors.sub}">ASESORÍA PATRIMONIAL INMOBILIARIA</text>
</svg>`;
}
