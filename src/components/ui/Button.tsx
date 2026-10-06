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
    'bg-accent text-on-accent hover:bg-accent-strong border border-transparent ',
  secondary:
    'bg-muted-surface/80 text-foreground hover:bg-hover-surface border border-line-strong/80',
  ghost: 'bg-transparent text-body hover:bg-muted-surface/70 hover:text-foreground border border-transparent',
  danger:
    'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30',
  outline:
    'bg-transparent text-accent hover:bg-accent/10 border border-accent/30',
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
        'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
