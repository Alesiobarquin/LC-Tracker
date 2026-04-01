import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 32, ...props }: LogoProps) {
  const uid = React.useId().replace(/:/g, '');
  const auraGradientId = `logo-aura-${uid}`;
  const glowFilterId = `logo-glow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <radialGradient
          id={auraGradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(50 62) rotate(90) scale(30 28)"
        >
          <stop offset="0" stopColor="currentColor" stopOpacity="0.56" />
          <stop offset="0.72" stopColor="currentColor" stopOpacity="0.24" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <filter id={glowFilterId} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#6AFFDC" floodOpacity="0.95" />
          <feDropShadow dx="0" dy="0" stdDeviation="4.8" floodColor="#20C99A" floodOpacity="0.8" />
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#14906E" floodOpacity="0.45" />
        </filter>
      </defs>

      <path d="M10 84L29 50L37 58L50 18L61 42L69 34L90 84Z" fill={`url(#${auraGradientId})`} opacity="0.74" />

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowFilterId})`}>
        <path d="M10 84L29 50L37 58L50 18L61 42L69 34L90 84Z" strokeWidth="3.9" opacity="0.96" />
        <path d="M20 84L33 61L39 67L50 40L58 54L65 48L80 84Z" strokeWidth="3" opacity="0.72" />
      </g>

    </svg>
  );
}
