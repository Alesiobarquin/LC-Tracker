import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SectionHeading } from "../ui/StudyTrace";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Why does LC-Tracker strictly decouple recall from independent coding?",
    answer:
      "Because recognizing or reciting an algorithmic concept in 30 seconds does not prove you can handle edge cases, syntax intricacies, and time complexity in real code. Likewise, struggling with tricky syntax does not mean your conceptual approach was flawed. Treating recall checks and coding blocks as separate evidence gives you honest diagnostics.",
  },
  {
    question: "How does the daily time budget prevent study burnout?",
    answer:
      "Instead of forcing you to clear an endless backlog of overdue problems, LC-Tracker allocates only the minutes you have available today (e.g. 45 minutes). Study time already spent today automatically subtracts from your remaining budget. The queue prioritizes essential checks and lets lower-priority tasks wait without shame.",
  },
  {
    question: "Does the app automatically grade code or predict interview success?",
    answer:
      "No. We reject fake predictive claims. Outcomes are self-reported: you honestly record whether tests passed, what hints were referenced, and how clearly you explained complexity. Real interview performance depends on articulation and poise under pressure, which cannot be measured by a synthetic score.",
  },
  {
    question: "Is my study progress private and exportable?",
    answer:
      "Yes, 100%. LC-Tracker provides atomic full-database JSON export and import. Your review intervals, notes, timing data, and problem states are completely under your control, with zero vendor lock-in.",
  },
  {
    question: "What happens on scheduled rest days or during vacations?",
    answer:
      "You can configure recurring rest days (e.g. Sundays off) and inclusive blackout date ranges for travel or recovery. The scheduling planner respects these periods, pausing active review demands so you return without a demoralizing avalanche of overdue alerts.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="w-full my-16">
      <div className="mb-8">
        <SectionHeading index="04" title="Methodology & Data Sovereignty" />
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
          Frequently Answered Questions
        </h2>
        <p className="text-sm text-muted mt-2 max-w-xl leading-relaxed">
          Clear answers regarding how the spaced repetition model functions, what evidence is gathered,
          and how your progress is preserved.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.question}
              className="rounded-card border border-line bg-surface overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-muted-surface/30 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base font-semibold text-foreground">
                  {faq.question}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-muted transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180 text-accent" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted leading-relaxed border-t border-line/60">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
