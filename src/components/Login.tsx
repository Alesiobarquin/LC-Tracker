import React, { useState } from "react";
import { useSignIn } from "@clerk/react/legacy";
import { PublicHeader } from "./PublicHeader";
import { Logo } from "./Logo";
import { BRAND } from "../constants/brand";
import { TraceIndex } from "./ui/StudyTrace";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function Login() {
  const { signIn, isLoaded } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Google sign-in failed. Check your connection and try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="brand-shell login-page">
      <PublicHeader fixed showSignIn={false} />
      <main className="login-composition">
        <section className="login-form">
          <Logo className="mb-6 text-accent" size={36} />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in to LC Tracker
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {BRAND.login.subtitle}
          </p>
          <div className="mt-8 border-t border-line pt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={!isLoaded || isLoading}
              className="brand-button-primary flex min-h-11 w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <GoogleIcon />
              )}
              {isLoading ? "Redirecting…" : "Continue with Google"}
            </button>
            {errorMessage && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {errorMessage}
              </p>
            )}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-subtle">
            Your sessions and study plan are saved to your account.
          </p>
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
