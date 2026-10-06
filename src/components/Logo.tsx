import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 32, ...props }: LogoProps) {
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
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 84L29 50L37 58L50 18L61 42L69 34L90 84Z" strokeWidth="3.9" opacity="0.96" />
        <path d="M20 84L33 61L39 67L50 40L58 54L65 48L80 84Z" strokeWidth="3" opacity="0.72" />
      </g>

    </svg>
  );
}
