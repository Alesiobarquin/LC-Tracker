import React from 'react';
import { cn } from '../../utils/cn';

export interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  description,
  actions,
  className,
}) => (
  <header
    className={cn(
      'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
      className
    )}
  >
    <div className="min-w-0 space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
        {icon ? <span className="text-emerald-400 shrink-0">{icon}</span> : null}
        <span className="min-w-0">{title}</span>
      </h1>
      {description ? (
        <div className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-3xl">
          {description}
        </div>
      ) : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
  </header>
);
