import { useLayoutEffect, useRef } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Braces, Code2, GitBranch, Github, NotebookPen } from "lucide-react";
import { PublicHeader } from "./PublicHeader";
import { Logo } from "./Logo";
import { LandingPlanPreview } from "./LandingPlanPreview";
import { BRAND } from "../constants/brand";

const repository = "https://github.com/Alesiobarquin/LC-Tracker";

const resources = [
  { href: "/library", title: "Problem library", detail: "Browse problems by topic, difficulty, and study list.", Icon: BookOpen },
  { href: "/patterns", title: "Pattern lessons", detail: "Learn when to use a pattern and what makes it work.", Icon: GitBranch },
  { href: "/syntax", title: "Syntax reference", detail: "Practice recalling Python and C++ syntax.", Icon: Code2 },
];

export function LandingPage() {
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const id = window.location.hash.slice(1);
    if (id === "plan-preview" || id === "how-it-works") {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    }

    const main = mainRef.current;
    if (!main || typeof IntersectionObserver === "undefined") return;

    const updatePageTop = () => main.toggleAttribute("data-at-top", window.scrollY < 24);
    updatePageTop();
    window.addEventListener("scroll", updatePageTop, { passive: true });

    const observer = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        target.toggleAttribute("data-out-of-view", !isIntersecting);
      }
    }, { rootMargin: "-72px 0px -96px" });
    for (const section of main.querySelectorAll(".landing-reveal")) {
      section.setAttribute("data-out-of-view", "");
      observer.observe(section);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updatePageTop);
    };
  }, []);

  return (
    <div className="brand-shell text-foreground">
      <a href="#landing-content" className="landing-skip">Skip to content</a>
      <PublicHeader />
      <main ref={mainRef} id="landing-content" tabIndex={-1} className="landing-main-width">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="landing-kicker">LeetCode interview practice</p>
            <h1 id="landing-title">Know what to <span>practice next.</span></h1>
            <p className="landing-lede">
              LC Tracker builds a daily plan for recall and coding from your practice history,
              available time, and interview date.
            </p>
            <div className="landing-hero-actions">
              <a href="/sign-up" className="landing-primary-action">
                Build my study plan <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a href="#plan-preview" className="landing-text-action">
                Try the sample <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
        <LandingPlanPreview />

        <section id="how-it-works" className="landing-method landing-reveal" aria-labelledby="workflow-title">
          <div className="landing-section-intro">
            <h2 id="workflow-title">How the planner works</h2>
            <p>LC Tracker schedules recall and coding checks separately. Both draw from the time you set aside for practice.</p>
            <a className="landing-text-action" href={repository + "/blob/main/docs/study-strategy.md"}>
              Read the study strategy <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
          <div className="landing-method-pair">
            <section aria-labelledby="landing-recall-title">
              <p className="landing-kicker"><NotebookPen size={15} aria-hidden="true" /> Recall</p>
              <h3 id="landing-recall-title">Write from memory.</h3>
              <p>Start with the key idea. Open a reference after you’ve tried, then record what came back and where you got stuck.</p>
            </section>
            <section aria-labelledby="landing-coding-title">
              <p className="landing-kicker"><Braces size={16} aria-hidden="true" /> Coding</p>
              <h3 id="landing-coding-title">Rebuild the solution.</h3>
              <p>Implement it on LeetCode. Record the test result, the help you used, and what you can explain.</p>
            </section>
          </div>
        </section>

        <section className="landing-resources landing-reveal" aria-labelledby="resources-title">
          <div className="landing-section-intro">
            <h2 id="resources-title">Study without an account</h2>
            <p>The references are public. Sign in to save your study plan, practice history, and notes.</p>
          </div>
          <ul className="landing-resource-list">
            {resources.map(({ href, title, detail, Icon }) => (
              <li key={href}>
                <a href={href}>
                  <Icon size={20} aria-hidden="true" />
                  <div><h3>{title}</h3><p>{detail}</p></div>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <a href="/" className="landing-footer-brand"><Logo size={19} className="text-accent" /> {BRAND.name}</a>
          <nav aria-label="Footer">
            <a href={repository} className="landing-footer-source"><Github size={15} aria-hidden="true" /> Source on GitHub</a>
            <a href="/library/explanations">Explanations</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
