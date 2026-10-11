import React from "react";
import {
  Brain,
  Timer,
  ShieldCheck,
  Code2,
  Download,
  CalendarCheck2,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "motion/react";
import { SectionHeading } from "../ui/StudyTrace";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  badge: string;
  description: string;
  detail: string;
  linkText?: string;
  linkHref?: string;
}

const FEATURES: FeatureCardProps[] = [
  {
    icon: Brain,
    title: "Cognitive Spaced Retrieval",
    badge: "Active Recall",
    description:
      "Separate the approach recall from the implementation code. Explain the decision boundary in 30 seconds before viewing hints.",
    detail: "Prevents the illusion of competence caused by recognizing a solution after reading it.",
  },
  {
    icon: Timer,
    title: "Bounded Daily Sequences",
    badge: "Budgeting",
    description:
      "The engine calculates a realistic practice queue that fits your calendar today. Rest days and pauses are automatically respected.",
    detail: "Recorded study minutes subtract from your daily allocation so you never burn out.",
  },
  {
    icon: ShieldCheck,
    title: "Dual-Evidence Protocol",
    badge: "Scientific Rigor",
    description:
      "A recall pass never counts as coding evidence. Unseen variations and timed unassisted implementations establish genuine retention.",
    detail: "Self-reported assistance categories: unassisted, hint, or solution followed.",
  },
  {
    icon: Code2,
    title: "Syntax Vault & Pattern Foundations",
    badge: "Language Tooling",
    description:
      "Fast flashcard refreshers for Python 3 and C++ standard library idioms (heapq, lower_bound, deque) right beside the problem.",
    detail: "Eliminates syntax hesitation during intense interview implementation rounds.",
    linkText: "Explore Syntax Vault",
    linkHref: "/syntax",
  },
  {
    icon: Download,
    title: "100% Exportable & Private",
    badge: "Data Sovereignty",
    description:
      "Zero vendor lock-in. Export your complete study history, review intervals, notes, and session logs as portable JSON snapshots.",
    detail: "All scheduling runs client-side. Your algorithms journey belongs completely to you.",
  },
  {
    icon: CalendarCheck2,
    title: "Rest-Day & Blackout Awareness",
    badge: "Sustainability",
    description:
      "Configure weekly rest days or schedule travel blackouts. The algorithm pauses degradation without punitive streak loss.",
    detail: "Consistency is sustained through sustainable pacing, not manipulative gamification.",
  },
];

export function LuxuryFeatureGrid() {
  return (
    <div className="w-full my-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <SectionHeading index="02" title="Engineered for deliberate practice" />
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            Built for Engineers Who Reject Rote Memorization
          </h2>
          <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
            Every feature is calibrated around cognitive science: interleaving, retrieval practice,
            and spaced repetition—without gamified noise or fake streak anxiety.
          </p>
        </div>
        <span className="text-xs font-mono text-subtle hidden sm:block">
          Architecture v2.4
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className="rounded-card border border-line bg-surface p-5 sm:p-6 flex flex-col justify-between hover:border-line-strong hover:shadow-xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-md bg-muted-surface border border-line flex items-center justify-center text-accent">
                    <Icon size={18} />
                  </div>
                  <span className="register-label">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted mt-2.5 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-line/60">
                <p className="text-[11px] font-mono text-subtle leading-relaxed">
                  {feature.detail}
                </p>
                {feature.linkHref && (
                  <a
                    href={feature.linkHref}
                    className="quiet-action text-xs font-medium inline-flex items-center gap-1 mt-3"
                  >
                    {feature.linkText} <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
