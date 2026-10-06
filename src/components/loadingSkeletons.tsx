import { clsx } from "clsx";
import { TraceIndex } from "./ui/StudyTrace";

function Placeholder({ className }: { className?: string }) {
  return (
    <div
      className={clsx("animate-pulse rounded-sm bg-muted-surface", className)}
    />
  );
}
function LoadingHeading() {
  return (
    <div className="space-y-3 pb-2">
      <Placeholder className="h-8 w-56 max-w-full" />
      <Placeholder className="h-3 w-64 max-w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading study plan" className="space-y-7">
      <LoadingHeading />
      <div className="study-layout">
        <div className="plan-track">
          <div className="study-next space-y-5">
            <TraceIndex>01</TraceIndex>
            <Placeholder className="h-6 w-36" />
            <Placeholder className="h-10 w-64 max-w-full" />
            <Placeholder className="h-3 w-full" />
            <Placeholder className="h-10 w-32" />
          </div>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="border-b border-line py-5 flex items-center gap-4"
            >
              <Placeholder className="h-6 w-6 shrink-0" />
              <Placeholder className="h-4 w-2/3" />
            </div>
          ))}
        </div>
        <div className="study-rail space-y-6">
          <Placeholder className="h-3 w-32" />
          <Placeholder className="h-12 w-20" />
          <Placeholder className="h-2 w-full" />
          {[0, 1, 2].map((i) => (
            <Placeholder key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
export function AnalyticsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading learning evidence"
      className="space-y-7"
    >
      <LoadingHeading />
      <div className="evidence-overview">
        <div className="space-y-5">
          <Placeholder className="h-3 w-40" />
          <Placeholder className="h-16 w-40" />
          <div className="study-chart h-32" />
        </div>
        <div className="evidence-checks">
          {[0, 1, 2].map((i) => (
            <div key={i} className="evidence-check">
              <Placeholder className="h-4 w-4" />
              <div className="space-y-3">
                <Placeholder className="h-3 w-28" />
                <Placeholder className="h-6 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="evidence-ledgers">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-5 register-section w-full">
            <Placeholder className="h-4 w-40" />
            {[0, 1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="flex justify-between border-b border-line py-3"
              >
                <Placeholder className="h-3 w-1/2" />
                <Placeholder className="h-3 w-6" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
export function ProblemLibrarySkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading problem library"
      className="space-y-6"
    >
      <LoadingHeading />
      <div className="flex gap-5 border-b border-line pb-4">
        {[0, 1, 2].map((i) => (
          <Placeholder key={i} className="h-5 w-24" />
        ))}
      </div>
      <Placeholder className="h-10 w-full" />
      <div className="divide-y divide-line">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex items-center gap-5 py-4">
            <Placeholder className="h-4 w-4 shrink-0" />
            <Placeholder className="h-3 flex-1 max-w-lg" />
            <Placeholder className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PatternSkeleton() {
  return (
    <div role="status" aria-label="Loading pattern index" className="space-y-7">
      <LoadingHeading />
      <Placeholder className="h-8 w-60 max-w-full" />
      <Placeholder className="h-10 w-full" />
      {[0, 1].map((chapter) => (
        <section key={chapter} className="pattern-chapter">
          <div className="chapter-heading">
            <Placeholder className="h-8 w-10" />
            <Placeholder className="h-3 w-24" />
          </div>
          <div>
            {[0, 1, 2].map((row) => (
              <div key={row} className="pattern-row">
                <TraceIndex>{String(row + 1).padStart(2, "0")}</TraceIndex>
                <div className="space-y-3">
                  <Placeholder
                    className={`h-6 ${row === 0 ? "w-3/4" : "w-1/2"}`}
                  />
                  <Placeholder className="h-3 w-full" />
                </div>
                <Placeholder className="h-4 w-20 max-w-full" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
