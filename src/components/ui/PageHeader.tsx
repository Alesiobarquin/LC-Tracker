import React from "react";
import { cn } from "../../utils/cn";

export interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className,
}) => (
  <header
    className={cn(
      "page-heading flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
      className,
    )}
  >
    <div className="min-w-0 space-y-2">
      <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.045em] leading-tight text-foreground flex items-center gap-3">
        <span className="min-w-0">{title}</span>
      </h1>
      {description ? (
        <div className="text-sm text-muted leading-relaxed max-w-2xl">
          {description}
        </div>
      ) : null}
    </div>
    {actions ? (
      <div className="page-heading-actions flex flex-wrap items-center gap-2 shrink-0">
        {actions}
      </div>
    ) : null}
  </header>
);
