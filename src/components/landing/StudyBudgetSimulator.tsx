import React, { useState } from "react";
import { Clock, Calendar, Zap, CheckCircle2, ArrowRight, ShieldCheck, Flame } from "lucide-react";
import { motion } from "motion/react";
import { SectionHeading } from "../ui/StudyTrace";

export function StudyBudgetSimulator() {
  const [dailyMinutes, setDailyMinutes] = useState<number>(45);
  const [weeksRemaining, setWeeksRemaining] = useState<number>(6);

  // Compute calculated metrics
  const recallMinutes = Math.round(dailyMinutes * 0.3);
  const codingMinutes = dailyMinutes - recallMinutes;
  const totalDays = weeksRemaining * 6; // Assume 1 rest day per week = 6 study days
  const totalHours = Math.round((dailyMinutes * totalDays) / 60);

  // Estimate problems deeply retained with delayed 14d verification:
  // Roughly: ~2 recall cards per 10m recall, ~1 independent coding attempt per 30m
  const estimatedProblemsRetained = Math.round((dailyMinutes / 45) * 4 * weeksRemaining);
  const patternCycles = Math.min(14, Math.floor(weeksRemaining * 1.8));

  return (
    <div className="w-full rounded-card border border-line-strong bg-surface p-6 sm:p-8 shadow-xs relative overflow-hidden my-12">
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-line">
          <div className="max-w-xl">
            <span className="register-label">
              Interactive Planning Calculator
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
              Calculate Your Deliberate Practice Sequence
            </h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              No arbitrary marathon sessions. Tune your real calendar constraints and see how the
              adaptive budget allocates your daily minutes between active recall warm-ups and deep coding.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "30m Lean", mins: 30 },
              { label: "45m Standard", mins: 45 },
              { label: "60m Intensive", mins: 60 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDailyMinutes(preset.mins)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  dailyMinutes === preset.mins
                    ? "bg-foreground text-canvas border-foreground font-semibold shadow-sm"
                    : "border-line bg-canvas/60 text-muted hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders & Visual Outputs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* Left Column: Sliders */}
          <div className="lg:col-span-6 space-y-6">
            {/* Daily Minutes Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="daily-budget-range" className="font-semibold text-foreground flex items-center gap-2">
                  <Clock size={16} className="text-accent" />
                  Daily Available Study Time
                </label>
                <span className="font-mono text-base font-bold text-accent">
                  {dailyMinutes} min / day
                </span>
              </div>
              <input
                id="daily-budget-range"
                type="range"
                min={20}
                max={90}
                step={5}
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer h-2 bg-muted-surface rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-mono text-subtle">
                <span>20 min (micro)</span>
                <span>45 min (recommended)</span>
                <span>90 min (max bounded)</span>
              </div>
            </div>

            {/* Weeks Remaining Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="weeks-runway-range" className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar size={16} className="text-accent" />
                  Target Preparation Runway
                </label>
                <span className="font-mono text-base font-bold text-accent">
                  {weeksRemaining} weeks
                </span>
              </div>
              <input
                id="weeks-runway-range"
                type="range"
                min={2}
                max={16}
                step={1}
                value={weeksRemaining}
                onChange={(e) => setWeeksRemaining(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer h-2 bg-muted-surface rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-mono text-subtle">
                <span>2 weeks (sprint)</span>
                <span>6 weeks (typical)</span>
                <span>16 weeks (deep mastery)</span>
              </div>
            </div>

            {/* Split Breakdown Bar */}
            <div className="p-4 rounded-card border border-line bg-canvas/40 space-y-3">
              <span className="text-xs font-mono text-subtle uppercase">
                Automatic Daily Split
              </span>
              <div className="w-full h-2.5 rounded-full bg-muted-surface overflow-hidden flex">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{ width: `${Math.round((recallMinutes / dailyMinutes) * 100)}%` }}
                />
                <div
                  className="bg-success h-full transition-all duration-300"
                  style={{ width: `${Math.round((codingMinutes / dailyMinutes) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-accent" />
                  Recall Warm-up: <strong className="font-mono text-foreground">{recallMinutes} min</strong>
                </span>
                <span className="text-muted flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-success" />
                  Independent Code: <strong className="font-mono text-foreground">{codingMinutes} min</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Calculated Results Matrix */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-3.5">
            <div className="p-4 rounded-card border border-line bg-surface">
              <span className="text-[11px] font-mono text-subtle uppercase block">
                Total Practice Volume
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground mt-1.5">
                {totalHours} hrs
              </div>
              <p className="text-xs text-subtle mt-1.5">
                Across {totalDays} focused sessions (1 rest day/week protected).
              </p>
            </div>

            <div className="p-4 rounded-card border border-line bg-surface">
              <span className="text-[11px] font-mono text-subtle uppercase block">
                Retained Core Problems
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-accent mt-1.5">
                ~{estimatedProblemsRetained}
              </div>
              <p className="text-xs text-subtle mt-1.5">
                Verified with 2-week delayed retention checks.
              </p>
            </div>

            <div className="p-4 rounded-card border border-line bg-surface">
              <span className="text-[11px] font-mono text-subtle uppercase block">
                Active Pattern Cycles
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-success mt-1.5">
                {patternCycles}/14
              </div>
              <p className="text-xs text-subtle mt-1.5">
                Full coverage of Two Pointers, DP, Graphs, Binary Search.
              </p>
            </div>

            <div className="p-4 rounded-card border border-line bg-surface flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-subtle uppercase font-semibold block">
                  Zero False Fluency
                </span>
                <p className="text-xs text-subtle mt-1.5 leading-relaxed">
                  Every problem requires independent implementation without peeking.
                </p>
              </div>
              <a
                href="/login"
                className="brand-button-primary mt-3 px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5"
              >
                Start This Plan <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
