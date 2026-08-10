import React from 'react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.18)]',
  secondary:
    'bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/80',
  ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100 border border-transparent',
  danger:
    'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30',
  outline:
    'bg-transparent text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs rounded-xl min-h-10',
  md: 'px-4 py-2.5 text-sm rounded-xl min-h-11',
  lg: 'px-6 py-3.5 text-base rounded-2xl min-h-12',
  icon: 'p-2.5 rounded-xl min-h-11 min-w-11 inline-flex items-center justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
