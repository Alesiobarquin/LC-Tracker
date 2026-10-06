import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'text-muted',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-body',
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
      'inline-flex items-center gap-1.5 text-[11px] font-mono leading-5',
      toneClasses[tone],
      className
    )}
    {...props}
  />
);
