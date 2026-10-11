import React from "react";
import { ArrowRight, ArrowUpRight, Github, Play, Sparkles, Shield, Clock, Brain, Terminal } from "lucide-react";
import { PublicHeader } from "./PublicHeader";
import { Logo } from "./Logo";
import { SectionHeading } from "./ui/StudyTrace";
import { BRAND } from "../constants/brand";
import { VideoWalkthrough } from "./landing/VideoWalkthrough";
import { AnimatedPracticeLoop } from "./landing/AnimatedPracticeLoop";
import { StudyBudgetSimulator } from "./landing/StudyBudgetSimulator";
import { LuxuryFeatureGrid } from "./landing/LuxuryFeatureGrid";
import { ComparisonMatrix } from "./landing/ComparisonMatrix";
import { FaqAccordion } from "./landing/FaqAccordion";

export function LandingPage() {
  const scrollToWalkthrough = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("walkthrough-theater");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="brand-shell landing-page text-foreground relative overflow-hidden">
      {/* Luxury Background Architectural Grid & Mesh */}
      <div className="luxury-grid-mesh h-[850px] opacity-45 dark:opacity-25" aria-hidden="true" />

      {/* Luxury Ambient Glow Orbs */}
      <div
        className="luxury-glow-ambient w-[600px] h-[600px] -top-36 left-1/2 -translate-x-1/2 opacity-60 dark:opacity-50"
        aria-hidden="true"
      />
      <div
        className="luxury-glow-ambient w-[450px] h-[450px] top-[750px] -left-36 opacity-35 dark:opacity-25"
        aria-hidden="true"
      />
      <div
        className="luxury-glow-ambient w-[500px] h-[500px] top-[1600px] -right-36 opacity-35 dark:opacity-25"
        aria-hidden="true"
      />

      <PublicHeader />

      <main className="landing-container relative z-10">
        {/* HERO SECTION */}
        <section className="landing-introduction pt-12 pb-16 sm:py-20">
          <div className="landing-introduction-copy space-y-6">
            <h1>
              Know what to
              <span className="landing-headline-accent">solve next.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted leading-relaxed max-w-xl">
              Plan around the time you have today. Recall the core invariant from memory,
              code independently in timed blocks, and track genuine retention evidence.
            </p>

            {/* Bespoke CTAs */}
            <div className="flex flex-wrap gap-3.5 items-center pt-2">
              <a
                href="/login"
                className="luxury-cta-primary luxury-button-glow group"
              >
                <span>Start studying</span>
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="#walkthrough-theater"
                role="button"
                onClick={scrollToWalkthrough}
                className="luxury-cta-secondary group"
              >
                <span className="luxury-play-icon-housing">
                  <Play size={10} className="fill-accent translate-x-[0.5px]" />
                </span>
                <span>Watch Walkthrough</span>
              </a>
              <a href="/library" className="quiet-action text-sm font-medium ml-1">
                Explore library <ArrowUpRight size={14} />
              </a>
            </div>

            {/* Curated Trust Markers & Telemetry Ribbon */}
            <div className="pt-6 border-t border-line/60 flex flex-wrap items-center gap-y-2.5 gap-x-5 text-xs text-subtle">
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_6px_var(--palette-success)]" />
                <span className="font-medium text-foreground">150+ problems</span> curated
              </span>
              <span className="text-line-strong">·</span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--palette-accent)]" />
                <span className="font-medium text-foreground">Dual-check</span> protocol
              </span>
              <span className="text-line-strong">·</span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                <span className="font-medium text-foreground">100% exportable</span> JSON
              </span>
            </div>
          </div>

          {/* Animated Practice Loop Showcase */}
          <div className="w-full">
            <AnimatedPracticeLoop />
          </div>
        </section>

        {/* DELUXE INTERACTIVE VIDEO WALKTHROUGH & SIMULATED PLAYTHROUGH */}
        <section className="py-12 border-t border-line">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <span className="register-label">
              Interactive Product Tour
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mt-2">
              The Deliberate Practice Walkthrough
            </h2>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              Watch the simulated video tour in real-time or click any stage to test-drive
              the interactive study controls.
            </p>
          </div>

          <VideoWalkthrough />
        </section>

        {/* SECTION 01: A PLAN THAT FITS TODAY */}
        <section className="landing-section">
          <div className="landing-section-copy">
            <SectionHeading index="01" title="A plan that fits today" />
            <h2>
              One next action.
              <br />
              <span className="text-muted">A bounded study sequence.</span>
            </h2>
            <p>
              The daily plan combines brief recall with a focused coding block.
              Recorded and active study time reduce the remaining budget. Rest
              days and scheduled breaks are respected.
            </p>
            <a
              href="https://github.com/Alesiobarquin/LC-Tracker/blob/main/docs/study-strategy.md"
              className="quiet-action mt-5"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the study strategy <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="planning-register rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="planning-register-heading">
              <span className="register-label">Practice allocation</span>
              <span className="text-[10px] font-mono text-subtle">
                Based on your budget
              </span>
            </div>
            <dl>
              <div>
                <dt>Recall warm-up</dt>
                <dd>Explain an approach before opening notes.</dd>
                <span className="font-mono text-[10px] text-subtle">
                  ~30% maximum
                </span>
              </div>
              <div>
                <dt>Main practice</dt>
                <dd>Learn, revisit implementation, or try a variation.</dd>
                <span className="font-mono text-[10px] text-subtle">
                  Remaining time
                </span>
              </div>
              <div>
                <dt>Continuation</dt>
                <dd>Resume an unfinished attempt in another block.</dd>
                <span className="font-mono text-[10px] text-subtle">
                  When needed
                </span>
              </div>
            </dl>
            <p className="text-[11px] text-subtle mt-4 leading-relaxed">
              The queue can be longer than today’s plan. You do not need to
              clear it.
            </p>
          </div>
        </section>

        {/* INTERACTIVE STUDY BUDGET SIMULATOR */}
        <section className="py-8">
          <StudyBudgetSimulator />
        </section>

        {/* SECTION 02: EVIDENCE, WITH CONTEXT */}
        <section className="landing-section">
          <div className="landing-section-copy">
            <SectionHeading index="02" title="Evidence, with context" />
            <h2>
              A solve is a start.
              <br />
              <span className="text-muted">Keep the details.</span>
            </h2>
            <p>
              Record coding results in one tap. Details about assistance and
              explanation are optional, and remain separate from confidence.
              Delayed independent coding and unseen variations provide different
              evidence from a same-day recall check.
            </p>
            <p className="text-xs text-subtle mt-4">
              Outcomes are self-reported. The app does not automatically grade
              code or predict interview performance.
            </p>
          </div>

          <figure className="example-record rounded-card border border-line-strong bg-surface p-6 shadow-xs">
            <figcaption className="flex justify-between items-center gap-3 pb-4 border-b border-line">
              <span className="register-label">Example coding record</span>
              <span className="font-mono text-[10px] text-subtle">
                Illustrative / not a user result
              </span>
            </figcaption>
            <div className="flex justify-between items-baseline gap-4 py-5">
              <h3 className="text-2xl font-medium tracking-tight">LRU Cache</h3>
              <span className="font-mono text-sm text-muted">22 min</span>
            </div>
            <dl className="example-record-fields">
              <div>
                <dt>Correctness</dt>
                <dd>Tests passed</dd>
              </div>
              <div>
                <dt>Assistance</dt>
                <dd>No hints</dd>
              </div>
              <div>
                <dt>Explanation</dt>
                <dd>Clear</dd>
              </div>
            </dl>
            <p className="text-xs text-muted leading-relaxed pt-4 border-t border-line">
              One independent attempt. Delayed retention still needs another
              check.
            </p>
          </figure>
        </section>

        {/* LUXURY FEATURE PILLARS GRID */}
        <LuxuryFeatureGrid />

        {/* METHODOLOGY AUDIT & COMPARISON MATRIX */}
        <ComparisonMatrix />

        {/* FAQS ACCORDION */}
        <FaqAccordion />

        {/* EXPLORE THE MATERIAL */}
        <section className="landing-materials">
          <SectionHeading index="05" title="Explore the material" />
          <div className="material-links mt-6">
            <a href="/library" className="group">
              <span className="font-mono text-xs text-subtle group-hover:text-accent transition-colors">L</span>
              <div>
                <h3 className="group-hover:text-foreground transition-colors">Problem library</h3>
                <p>Curated lists, filters, and practice sessions.</p>
              </div>
              <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a href="/patterns" className="group">
              <span className="font-mono text-xs text-subtle group-hover:text-accent transition-colors">P</span>
              <div>
                <h3 className="group-hover:text-foreground transition-colors">Pattern lessons</h3>
                <p>Recognition cues, invariants, and worked examples.</p>
              </div>
              <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a href="/syntax" className="group">
              <span className="font-mono text-xs text-subtle group-hover:text-accent transition-colors">S</span>
              <div>
                <h3 className="group-hover:text-foreground transition-colors">Syntax reference</h3>
                <p>Python and C++ reference cards with recall practice.</p>
              </div>
              <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </section>

        {/* CLOSING CALLOUT */}
        <section className="my-14 rounded-card border border-line-strong bg-surface p-8 sm:p-12 text-center relative overflow-hidden shadow-xs">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="hero-badge-pill mx-auto">
              <span className="hero-badge-tag">
                <span className="hero-badge-dot" aria-hidden="true" />
                <span>Open Source</span>
              </span>
              <span className="hero-badge-text">
                Local-first scheduling · Free forever
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Ready for deliberate, permanent recall?
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Start your workspace today. Plan your practice session, verify retrieval,
              and build true algorithmic retention.
            </p>
            <div className="pt-3">
              <a
                href="/login"
                className="luxury-cta-primary group"
              >
                <span>Launch Workspace</span>
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container flex flex-wrap items-center justify-between gap-6 py-7">
          <span className="flex items-center gap-2 text-xs">
            <Logo size={20} className="text-accent" />
            {BRAND.name}
            <span className="text-subtle ml-3">© 2026</span>
          </span>
          <div className="flex items-center gap-6 text-xs text-muted">
            <a
              href="https://github.com/Alesiobarquin/LC-Tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Github size={14} />
              Source
            </a>
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
