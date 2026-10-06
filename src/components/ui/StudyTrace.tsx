import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export function TraceIndex({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("trace-index", active && "trace-index-active")}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  index,
  title,
  detail,
}: {
  index: string;
  title: string;
  detail?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div className="flex items-center gap-3 min-w-0">
        <TraceIndex>{index}</TraceIndex>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {detail && (
        <span className="text-xs text-subtle font-mono">{detail}</span>
      )}
    </div>
  );
}

export function BudgetMeter({
  spent,
  total,
}: {
  spent: number;
  total: number;
}) {
  const value = Math.min(spent, total || 1);
  return (
    <div
      className="budget-meter"
      role="progressbar"
      aria-label="Daily study time used"
      aria-valuemin={0}
      aria-valuemax={total || 1}
      aria-valuenow={value}
      aria-valuetext={`${spent} of ${total} minutes used`}
    >
      <span
        style={{
          width: `${Math.min(100, total ? (spent / total) * 100 : 0)}%`,
        }}
      />
    </div>
  );
}
