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
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M9 5H5v22h4M23 5h4v22h-4" stroke="currentColor" strokeWidth="2" />
      <path d="M10 21h5V11h7" stroke="currentColor" strokeWidth="2" />
      <path d="M10 26h10V16h2" stroke="currentColor" strokeWidth="1.5" opacity=".45" />
      <rect x="19" y="8" width="5" height="5" fill="currentColor" />

    </svg>
  );
}
