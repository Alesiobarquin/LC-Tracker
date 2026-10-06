import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  accent?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated = true, accent = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-md border transition-colors',
        elevated ? 'premium-card' : 'bg-surface/70 border-line',
        accent && 'border-accent/25 bg-accent/[0.04]',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('flex items-start justify-between gap-3 mb-4', className)} {...props} />;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => <h2 className={cn('text-xl font-semibold text-foreground', className)} {...props} />;

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => <p className={cn('text-sm text-muted leading-relaxed', className)} {...props} />;
