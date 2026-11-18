import { SignIn, SignUp } from "@clerk/react";
import { PublicHeader } from "./PublicHeader";
import { TraceIndex } from "./ui/StudyTrace";

export function Login({ createAccount }: { createAccount: boolean }) {
  const AuthForm = createAccount ? SignUp : SignIn;

  return (
    <div className="brand-shell login-page">
      <PublicHeader fixed showSignIn={false} />
      <main className="login-composition">
        <section className="login-form">
          <AuthForm
            routing="hash"
            oauthFlow="redirect"
            fallback={<p role="status" className="text-sm text-muted">Loading account options…</p>}
          />
          {createAccount && (
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Already use Google with LC Tracker? Continue with the same Google account to keep your saved progress.
            </p>
          )}
        </section>
        <aside className="login-notebook" aria-label="The study sequence">
          <p className="register-label mb-7">Plan → attempt → record</p>
          <ol>
            <li>
              <TraceIndex active>01</TraceIndex>
              <h2>Make time.</h2>
              <p>A daily plan bounded by your study budget.</p>
            </li>
            <li>
              <TraceIndex>02</TraceIndex>
              <h2>Try from memory.</h2>
              <p>Recall an approach, then implement independently.</p>
            </li>
            <li>
              <TraceIndex>03</TraceIndex>
              <h2>Keep the evidence.</h2>
              <p>Correctness, assistance, explanation, and time.</p>
            </li>
          </ol>
          <a href="/library" className="quiet-action mt-6">
            Browse the material first ↗
          </a>
        </aside>
      </main>
      <footer className="login-footer flex items-center gap-4 text-xs text-muted">
        <a href="/privacy" className="hover:text-foreground">
          Privacy Policy
        </a>
        <span aria-hidden="true">·</span>
        <a href="/terms" className="hover:text-foreground">
          Terms of Service
        </a>
      </footer>
    </div>
  );
}
