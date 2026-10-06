import { ArrowRight, ArrowUpRight, Github } from "lucide-react";
import { PublicHeader } from "./PublicHeader";
import { Logo } from "./Logo";
import { TraceIndex, SectionHeading } from "./ui/StudyTrace";
import { BRAND } from "../constants/brand";

function PracticeLoop() {
  return (
    <figure className="practice-loop" aria-labelledby="practice-loop-title">
      <figcaption className="flex justify-between gap-3 items-center pb-5 border-b border-line">
        <span id="practice-loop-title" className="text-xs font-medium">
          The practice loop
        </span>
        <span className="register-label">Two distinct checks</span>
      </figcaption>
      <div className="practice-loop-track loop-recall">
        <TraceIndex active>01</TraceIndex>
        <div>
          <p className="text-lg font-medium tracking-tight">
            Recall the approach
          </p>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            Explain from memory.
            <br />
            Compare with a reference.
          </p>
        </div>
        <span className="loop-track-mark" aria-hidden="true">
          R
        </span>
      </div>
      <div className="loop-connector">
        <span>Reasoning recorded</span>
        <span aria-hidden="true">↓</span>
      </div>
      <div className="practice-loop-track loop-coding">
        <TraceIndex>02</TraceIndex>
        <div>
          <p className="text-lg font-medium tracking-tight">
            Implement independently
          </p>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            Code, test, and explain.
            <br />
            Record any assistance.
          </p>
          <p className="loop-protocol">approach → code → test cases</p>
        </div>
        <span className="loop-track-mark" aria-hidden="true">
          C
        </span>
      </div>
      <div className="loop-connector">
        <span>Revisit after a delay</span>
        <span aria-hidden="true">↓</span>
      </div>
      <div className="practice-loop-track loop-track-last">
        <TraceIndex>03</TraceIndex>
        <div>
          <p className="text-lg font-medium tracking-tight">
            Try an unseen variation
          </p>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            Check whether the idea transfers.
          </p>
        </div>
        <span className="loop-track-mark" aria-hidden="true">
          V
        </span>
      </div>
      <p className="text-[10px] font-mono text-subtle pt-5 border-t border-line leading-relaxed">
        Recall success stays separate from coding evidence.
      </p>
    </figure>
  );
}

export function LandingPage() {
  return (
    <div className="brand-shell landing-page text-foreground">
      <PublicHeader />
      <main className="landing-container">
        <section className="landing-introduction">
          <div className="landing-introduction-copy">
            <p className="register-label flex items-center gap-2 mb-6">
              <span className="status-node bg-accent" aria-hidden="true" />A
              personal study workspace
            </p>
            <h1>
              A workspace for
              <br />
              <span className="text-muted">LeetCode practice.</span>
            </h1>
            <p className="text-base text-muted leading-relaxed max-w-md mt-6">
              Plan around the time you have. Recall an approach, code
              independently, and keep a record of what happened.
            </p>
            <div className="flex flex-wrap gap-5 items-center mt-8">
              <a
                href="/login"
                className="brand-button-primary ui-button inline-flex gap-3 items-center px-5 py-3 rounded-md text-sm font-medium"
              >
                Start studying <ArrowRight size={15} />
              </a>
              <a href="/library" className="quiet-action">
                Explore the library <ArrowUpRight size={14} />
              </a>
            </div>
            <p className="text-[11px] text-subtle mt-7">
              Open source. Your progress is exportable.
            </p>
          </div>
          <PracticeLoop />
        </section>

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
          <div className="planning-register">
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

        <section className="landing-section">
          <div className="landing-section-copy">
            <SectionHeading index="02" title="Evidence, with context" />
            <h2>
              A solve is a start.
              <br />
              <span className="text-muted">Keep the details.</span>
            </h2>
            <p>
              Correctness, assistance, and explanation are recorded separately
              from confidence. Delayed independent coding and unseen variations
              provide different evidence from a same-day recall check.
            </p>
            <p className="text-xs text-subtle mt-4">
              Outcomes are self-reported. The app does not automatically grade
              code or predict interview performance.
            </p>
          </div>
          <figure className="example-record">
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

        <section className="landing-materials">
          <SectionHeading index="03" title="Explore the material" />
          <div className="material-links">
            <a href="/library">
              <span className="font-mono text-xs text-subtle">L</span>
              <div>
                <h3>Problem library</h3>
                <p>Curated lists, filters, and practice sessions.</p>
              </div>
              <ArrowUpRight size={18} />
            </a>
            <a href="/patterns">
              <span className="font-mono text-xs text-subtle">P</span>
              <div>
                <h3>Pattern lessons</h3>
                <p>Recognition cues, invariants, and worked examples.</p>
              </div>
              <ArrowUpRight size={18} />
            </a>
            <a href="/syntax">
              <span className="font-mono text-xs text-subtle">S</span>
              <div>
                <h3>Syntax reference</h3>
                <p>Python and C++ reference cards with recall practice.</p>
              </div>
              <ArrowUpRight size={18} />
            </a>
          </div>
        </section>
      </main>
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
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Github size={14} />
              Source
            </a>
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default LandingPage;
