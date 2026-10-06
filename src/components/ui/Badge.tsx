import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-muted-surface/80 text-body border-line-strong/70',
  success: 'bg-accent/10 text-accent border-accent/25',
  warning: 'bg-warning/10 text-warning border-warning/25',
  danger: 'bg-danger/10 text-danger border-danger/25',
  info: 'bg-info/10 text-info border-info/25',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  tone = 'neutral',
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium',
      toneClasses[tone],
      className
    )}
    {...props}
  />
);
