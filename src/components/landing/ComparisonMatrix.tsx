import React from "react";
import { Check, X, ArrowRight, ShieldCheck } from "lucide-react";

export function ComparisonMatrix() {
  const comparisons = [
    {
      dimension: "Retention Verification",
      cramming: "Assumes solving once equals long-term memory",
      lcTracker: "Requires 14-day delayed unassisted recall check",
      winner: true,
    },
    {
      dimension: "Assistance Accountability",
      cramming: "Considers 'reading editorial + copying' as a pass",
      lcTracker: "Explicitly tracks unassisted vs hint vs solution",
      winner: true,
    },
    {
      dimension: "Time Allocation",
      cramming: "Unbounded 2-3 hour marathons leading to burnout",
      lcTracker: "Time-bounded 30-60m daily blocks with rest days",
      winner: true,
    },
    {
      dimension: "Pattern Generalization",
      cramming: "Practices with topic tags visible (false cues)",
      lcTracker: "Blind unseen variations test true pattern transfer",
      winner: true,
    },
    {
      dimension: "Data Ownership",
      cramming: "Locked inside proprietary SaaS databases",
      lcTracker: "100% exportable open JSON snapshots anytime",
      winner: true,
    },
  ];

  return (
    <div className="w-full my-12 rounded-card border border-line-strong bg-surface p-6 sm:p-8 shadow-xs">
      <div className="max-w-2xl mb-8">
        <span className="register-label">
          Methodology Audit
        </span>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
          Why 300 Random Solves Still Fail Interviews
        </h3>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          The difference between passive recognition and recall under interview pressure is
          deliberate retrieval. Compare the standard cramming routine with LC-Tracker’s empirical loop.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line text-xs font-mono text-subtle">
              <th className="py-3 px-4 w-1/3">Core Dimension</th>
              <th className="py-3 px-4 w-1/3 text-muted">Passive Cramming</th>
              <th className="py-3 px-4 w-1/3 text-accent font-bold">LC-Tracker Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-xs leading-relaxed">
            {comparisons.map((row) => (
              <tr key={row.dimension} className="hover:bg-muted-surface/30 transition-colors">
                <td className="py-4 px-4 font-semibold text-foreground">
                  {row.dimension}
                </td>
                <td className="py-4 px-4 text-muted flex items-start gap-2">
                  <X size={15} className="text-danger shrink-0 mt-0.5" />
                  <span>{row.cramming}</span>
                </td>
                <td className="py-4 px-4 text-foreground font-medium bg-accent/5 rounded-md">
                  <div className="flex items-start gap-2">
                    <Check size={15} className="text-success shrink-0 mt-0.5" />
                    <span>{row.lcTracker}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
