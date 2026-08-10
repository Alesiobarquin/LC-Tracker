import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface QueryErrorBannerProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const QueryErrorBanner: React.FC<QueryErrorBannerProps> = ({
  title = 'Could not load your data',
  message = 'A network or sync error interrupted this view. Your local session is still here — retry to refresh.',
  onRetry,
  className,
}) => (
  <div
    role="alert"
    className={cn(
      'rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3',
      className
    )}
  >
    <div className="flex items-start gap-3 min-w-0 flex-1">
      <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-red-200">{title}</p>
        <p className="text-xs text-red-200/80 mt-1 leading-relaxed">{message}</p>
      </div>
    </div>
    {onRetry ? (
      <Button variant="danger" size="sm" onClick={onRetry} className="shrink-0">
        <RefreshCw size={14} aria-hidden="true" />
        Retry
      </Button>
    ) : null}
  </div>
);
