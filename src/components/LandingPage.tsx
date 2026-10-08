import { useEffect } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Github,
  History,
  Target,
  Timer,
} from "lucide-react";
import { PublicHeader } from "./PublicHeader";
import { Logo } from "./Logo";
import { LandingPlanPreview } from "./LandingPlanPreview";
import { BRAND } from "../constants/brand";

function useLandingReveals() {
  useEffect(() => {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!targets.length) return;
    const root = document.documentElement;
    root.dataset.landingMotion = "ready";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      delete root.dataset.landingMotion;
    };
  }, []);
}

const journey = [
  {
    number: "01",
    label: "YOUR GOAL",
    title: "Set the direction.",
    body: "Choose a target curriculum and interview date. As an interview gets closer, ordinary study blocks put more time toward implementation.",
    Icon: Target,
  },
  {
    number: "02",
    label: "YOUR HISTORY",
    title: "Keep the useful detail.",
    body: "Record correctness, hints, explanation, and time spent. Due checks and demonstrated gaps can guide what comes back next.",
    Icon: History,
  },
  {
    number: "03",
    label: "YOUR DAY",
    title: "Work within your time.",
    body: "Recorded and active minutes count toward the daily budget. Rest days and scheduled breaks stay clear, and unfinished attempts can continue later.",
    Icon: Timer,
  },
];

export function LandingPage() {
  useLandingReveals();

  return (
    <div className="brand-shell landing-page text-foreground">
      <PublicHeader />
      <main>
        <div className="landing-main-width">
          <section className="landing-hero" aria-labelledby="landing-title">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">
                <span className="landing-eyebrow-mark" aria-hidden="true" />
                Personalized LeetCode practice
              </p>
              <h1 id="landing-title">
                Know what to
                <span>solve next.</span>
              </h1>
              <p className="landing-lede">
                Set your interview goal and study time. LC Tracker turns your
                recorded practice into a daily plan: what to review, what to
                solve, and why.
              </p>
              <div className="landing-hero-actions">
                <a href="/login" className="landing-primary-action">
                  Build my study plan <ArrowRight size={16} />
                </a>
                <a href="#plan-preview" className="landing-text-action">
                  See an example <ArrowDown size={15} />
                </a>
              </div>
              <p className="landing-hero-note">
                <span>Open source</span>
                <span aria-hidden="true">·</span>
                <span>Your progress is exportable</span>
              </p>
            </div>

            <LandingPlanPreview />
          </section>

          <section className="landing-journey" id="how-it-works" aria-labelledby="journey-title">
            <div className="landing-section-intro" data-reveal>
              <p className="landing-eyebrow landing-eyebrow--quiet">HOW YOUR NEXT PROBLEM IS CHOSEN</p>
              <h2 id="journey-title">A clear next step.<br />A reason behind it.</h2>
              <p>
                A solved count shows what you finished. This plan uses your
                target, recorded outcomes, and time budget to choose what comes next.
              </p>
            </div>
            <ol className="landing-journey-list">
              {journey.map(({ number, label, title, body, Icon }, index) => (
                <li data-reveal key={number} style={{ transitionDelay: `${index * 90}ms` }}>
                  <span className="landing-journey-number">{number}</span>
                  <div className="landing-journey-main">
                    <p className="landing-journey-label"><Icon size={15} /> {label}</p>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                  <ArrowUpRight className="landing-journey-arrow" size={16} aria-hidden="true" />
                </li>
              ))}
            </ol>
          </section>

          <section className="landing-evidence" aria-labelledby="evidence-title">
            <div className="landing-evidence-copy" data-reveal>
              <p className="landing-eyebrow landing-eyebrow--quiet">PRACTICE WITH CONTEXT</p>
              <h2 id="evidence-title">Remember the approach.<br />Rebuild the solution.</h2>
              <p>
                Recall checks what you can explain from memory. Coding asks you
                to implement, test, and explain the solution. LC Tracker keeps
                those checks separate in your history and schedule, so
                remembering a method never counts as an independent coding pass.
              </p>
              <p className="landing-evidence-note">
                Outcomes are self-reported. The app does not automatically
                grade code or predict interview performance.
              </p>
              <a
                href="https://github.com/Alesiobarquin/LC-Tracker/blob/main/docs/study-strategy.md"
                className="landing-text-action"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the study strategy <ArrowUpRight size={14} />
              </a>
            </div>

            <div className="landing-practice-register" data-reveal>
              <div className="landing-register-header">
                <span>THE PRACTICE LOOP</span>
                <span>Distinct evidence</span>
              </div>
              <div className="landing-practice-row">
                <span className="landing-practice-index">R</span>
                <div>
                  <p>01 · RECALL</p>
                  <h3>Explain the approach from memory.</h3>
                  <span>Compare with a reference after answering.</span>
                </div>
              </div>
              <div className="landing-practice-connector" aria-hidden="true"><span /><span>Record what you recall</span></div>
              <div className="landing-practice-row">
                <span className="landing-practice-index landing-practice-index--coding">C</span>
                <div>
                  <p>02 · CODING</p>
                  <h3>Implement, test, and explain.</h3>
                  <span>Record correctness and any assistance.</span>
                </div>
              </div>
              <div className="landing-practice-footer">
                <span>Delayed coding checks remain on the plan.</span>
                <span aria-hidden="true">↗</span>
              </div>
            </div>
          </section>

          <section className="landing-resources" aria-labelledby="resources-title">
            <div className="landing-resources-heading" data-reveal>
              <div>
                <p className="landing-eyebrow landing-eyebrow--quiet">EXPLORE THE WORKSPACE</p>
                <h2 id="resources-title">A plan you can follow<br />and inspect.</h2>
              </div>
              <a href="https://github.com/Alesiobarquin/LC-Tracker" className="landing-text-action" target="_blank" rel="noopener noreferrer">
                <Github size={15} /> View the source <ArrowUpRight size={14} />
              </a>
            </div>
            <div className="landing-resource-list">
              <a href="/library">
                <span>01</span>
                <div><h3>Problem library</h3><p>Browse curated lists and practice from a specific topic.</p></div>
                <ArrowUpRight size={16} />
              </a>
              <a href="/patterns">
                <span>02</span>
                <div><h3>Pattern lessons</h3><p>Study recognition cues, invariants, and worked examples.</p></div>
                <ArrowUpRight size={16} />
              </a>
              <a href="/syntax">
                <span>03</span>
                <div><h3>Syntax reference</h3><p>Review Python and C++ patterns with recall practice.</p></div>
                <ArrowUpRight size={16} />
              </a>
            </div>
          </section>

          <section className="landing-close" aria-labelledby="landing-close-title">
            <div>
              <p className="landing-eyebrow landing-eyebrow--quiet">START WITH YOUR NEXT GOAL</p>
              <h2 id="landing-close-title">Let your practice history<br />help choose what comes next.</h2>
            </div>
            <a href="/login" className="landing-primary-action">
              Build my study plan <ArrowRight size={16} />
            </a>
          </section>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <a href="/" className="landing-footer-brand">
            <Logo size={19} className="text-accent" />
            <span>{BRAND.name}</span>
          </a>
          <p>Goal-aware LeetCode practice, shaped by what you record.</p>
          <nav aria-label="Footer">
            <a href="/library">Library</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
          <span className="landing-copyright">© 2026</span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
