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
      <g 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ filter: 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.8)) drop-shadow(0 0 12px rgba(52, 211, 153, 0.4))' }}
      >
        {/* Outer Mountain Outline */}
        <path 
          d="M 12 80 L 28 45 L 34 53 L 50 18 L 58 40 L 66 32 L 76 58 L 79 53 L 90 80 Z" 
          strokeWidth="3.5" 
        />
        
        {/* Continuous Snow Cap Zig-Zag */}
        <path 
          d="M 39 42 L 45 35 L 50 45 L 54 36 L 58 40 L 62 36 L 71 45" 
          strokeWidth="2" 
        />
        
        {/* Inner peak dynamic shading lines */}
        <path d="M 48 24 L 51 32" strokeWidth="2" />
        <path d="M 46 30 L 49 38" strokeWidth="2" />
      </g>
    </svg>
  );
}
