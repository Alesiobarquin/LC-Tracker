import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TraceIndex } from "../ui/StudyTrace";
import { Brain, Terminal, Shuffle, Check, ArrowDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface LoopStepDetail {
  index: string;
  mark: string;
  title: string;
  shortDesc: string;
  protocol?: string;
  icon: React.ElementType;
  connectorText?: string;
  detailPoints: string[];
}

const LOOP_STEPS: LoopStepDetail[] = [
  {
    index: "01",
    mark: "R",
    title: "Recall the approach",
    shortDesc: "Explain from memory.\nCompare with a reference.",
    icon: Brain,
    connectorText: "Reasoning recorded",
    detailPoints: [
      "Retrieve the invariant and decision boundary without looking at code or hints.",
      "Calibrate latency: recall should feel crisp within 30-60 seconds.",
      "Recall success never counts as a coding pass or postpones coding verification.",
    ],
  },
  {
    index: "02",
    mark: "C",
    title: "Implement independently",
    shortDesc: "Code, test, and explain.\nRecord any assistance.",
    protocol: "approach → code → test cases",
    icon: Terminal,
    connectorText: "Revisit after a delay",
    detailPoints: [
      "Write clean code under a timed block with zero assistance.",
      "Record hints or solution views honestly; only unassisted passes qualify as independent.",
      "Verify time and space complexity and walk through edge cases.",
    ],
  },
  {
    index: "03",
    mark: "V",
    title: "Try an unseen variation",
    shortDesc: "Choose the approach with topic cues hidden.\nCode, test, and explain within a timed block.",
    icon: Shuffle,
    detailPoints: [
      "Tag-blind practice: problems presented without category tags (e.g. 'Binary Search', 'DP').",
      "Tests true algorithmic transfer and pattern recognition under interview ambiguity.",
      "Prevents false fluency caused by knowing the solution family in advance.",
    ],
  },
];

export function AnimatedPracticeLoop() {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <figure
      className="luxury-card-chassis relative rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden"
      aria-labelledby="practice-loop-title"
    >
      <figcaption className="flex justify-between gap-3 items-center pb-4 border-b border-line/80 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_var(--palette-accent)] animate-pulse" />
          <span id="practice-loop-title" className="text-xs font-semibold text-foreground tracking-tight">
            The Deliberate Practice Loop
          </span>
        </div>
        <span className="hero-badge-tag text-[9px] sm:text-[10px] py-0.5 px-2">
          Two distinct checks
        </span>
      </figcaption>

      <div className="relative pt-3.5 space-y-2 z-10" role="tablist" aria-label="Practice loop steps">
        {LOOP_STEPS.map((step, idx) => {
          const isSelected = activeStep === idx;
          const Icon = step.icon;

          return (
            <div key={step.index} className="relative">
              {/* Step Card */}
              <motion.div
                role="tab"
                tabIndex={0}
                id={`practice-loop-tab-${step.index}`}
                aria-selected={isSelected}
                aria-controls={`practice-loop-panel-${step.index}`}
                onClick={() => setActiveStep(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveStep(idx);
                  }
                }}
                className={cn(
                  "p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer relative select-none",
                  isSelected
                    ? "border-accent/80 bg-accent/[0.04] shadow-sm"
                    : "border-line/70 bg-canvas/40 hover:border-line-strong hover:bg-canvas/70"
                )}
                whileHover={{ scale: 1.004 }}
                whileTap={{ scale: 0.996 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* Glowing active step indicator beam */}
                {isSelected && (
                  <motion.div
                    layoutId="activeLoopBeam"
                    className="luxury-step-beam"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <div className="flex items-start justify-between gap-3 pl-1">
                  <div className="flex items-start gap-3 min-w-0">
                    <TraceIndex active={isSelected}>{step.index}</TraceIndex>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate">
                          {step.title}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted-surface text-subtle font-medium">
                          {step.mark}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1 leading-relaxed whitespace-pre-line">
                        {step.shortDesc}
                      </p>
                      {step.protocol && (
                        <p className="loop-protocol font-mono text-[10px] text-accent mt-1.5 font-medium">
                          {step.protocol}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 p-1.5 rounded-lg bg-surface border border-line/60 text-muted">
                    <Icon size={14} className={isSelected ? "text-accent" : "text-subtle"} />
                  </div>
                </div>

                {/* Expanded Micro-Protocol Points */}
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      id={`practice-loop-panel-${step.index}`}
                      role="tabpanel"
                      aria-labelledby={`practice-loop-tab-${step.index}`}
                      key={`detail-${step.index}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden pt-3 mt-3 border-t border-line/60"
                    >
                      <ul className="space-y-1.5">
                        {step.detailPoints.map((point) => (
                          <li
                            key={point}
                            className="flex items-start gap-2 text-[11px] text-muted leading-relaxed"
                          >
                            <Check size={12} className="text-accent shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Animated Connector Beam to Next Step */}
              {step.connectorText && (
                <div className="loop-connector flex items-center justify-between py-2 px-4 text-subtle font-mono text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/70 animate-pulse" />
                    <span>{step.connectorText}</span>
                  </div>
                  <motion.div
                    animate={{ y: [0, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  >
                    <ArrowDown size={11} className="text-accent/80" />
                  </motion.div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] font-mono text-subtle pt-3.5 mt-3 border-t border-line leading-relaxed relative z-10 flex flex-wrap items-center justify-between gap-2">
        <span>Recall success stays separate from coding evidence.</span>
        <span className="text-accent font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          Strict Protocol
        </span>
      </p>
    </figure>
  );
}
