import React from 'react';
import { clsx } from 'clsx';

function Shimmer({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-md bg-zinc-800/80', className)} />;
}

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8 animate-in">
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-2">
        <Shimmer className="h-9 w-48" />
        <Shimmer className="h-4 w-64" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Shimmer className="h-11 w-36" />
        <Shimmer className="h-11 w-32" />
      </div>
    </header>

    <Shimmer className="h-24 w-full rounded-2xl border border-zinc-800/80" />

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Shimmer className="h-8 w-40 mb-2" />
        <Shimmer className="h-64 w-full rounded-2xl border border-zinc-800/80" />
        <Shimmer className="h-8 w-48 mb-2" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Shimmer key={i} className="h-20 w-full rounded-2xl border border-zinc-800/80" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Shimmer className="h-56 w-full rounded-2xl border border-zinc-800/80" />
        <Shimmer className="h-48 w-full rounded-2xl border border-zinc-800/80" />
      </div>
    </div>
  </div>
);

export const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-8 animate-in pb-12">
    <div className="space-y-2">
      <Shimmer className="h-10 w-48" />
      <Shimmer className="h-4 w-72" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Shimmer key={i} className="h-28 rounded-2xl border border-zinc-800/80" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Shimmer className="h-64 rounded-2xl border border-zinc-800/80" />
      <Shimmer className="h-[500px] lg:col-span-2 rounded-2xl border border-zinc-800/80" />
    </div>
    <Shimmer className="h-48 rounded-2xl border border-zinc-800/80" />
  </div>
);

export const ProblemLibrarySkeleton: React.FC = () => (
  <div className="space-y-6 animate-in">
    <div className="space-y-2">
      <Shimmer className="h-9 w-56" />
      <Shimmer className="h-4 w-72" />
    </div>
    <div className="flex gap-2 border-b border-zinc-800 pb-2">
      {[0, 1, 2].map((i) => (
        <Shimmer key={i} className="h-10 w-28 rounded-lg" />
      ))}
    </div>
    <Shimmer className="h-24 w-full rounded-2xl border border-zinc-800/80" />
    <div className="flex flex-col md:flex-row gap-4">
      <Shimmer className="h-12 flex-1 rounded-xl" />
      <Shimmer className="h-12 w-full md:w-48 rounded-xl" />
    </div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="h-12 bg-zinc-950/50 border-b border-zinc-800" />
      <div className="divide-y divide-zinc-800">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <Shimmer className="h-5 w-5 rounded-full shrink-0" />
            <Shimmer className="h-4 flex-1 max-w-md" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-8 w-8 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
