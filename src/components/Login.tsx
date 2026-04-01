import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { Logo } from './Logo';
import { BRAND } from '../constants/brand';

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

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setIsLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="brand-shell relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Atmospheric background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 62% 52% at 50% 38%, rgba(16,185,129,0.09) 0%, transparent 72%), radial-gradient(circle at 16% 82%, rgba(20,184,166,0.08) 0%, transparent 42%), radial-gradient(circle at 84% 16%, rgba(34,197,94,0.07) 0%, transparent 38%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(circle at 50% 45%, black 0%, transparent 78%)',
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/20 opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/10 opacity-35" />
      </div>

      <a
        href="/"
        className="absolute top-5 left-6 z-20 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        ← {BRAND.login.backLabel}
      </a>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center gap-5">
          <div
            className="p-5 rounded-2xl border border-zinc-800 flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #18181b 0%, #111113 100%)',
              boxShadow:
                '0 0 0 1px rgba(52,211,153,0.12), 0 8px 32px -8px rgba(0,0,0,0.8), 0 0 40px -8px rgba(16,185,129,0.2)',
            }}
          >
            <Logo
              className="text-emerald-400"
              size={48}
              style={{ filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.7)) drop-shadow(0 0 24px rgba(52,211,153,0.3))' }}
            />
          </div>

          <div className="text-center">
            <h1 className="text-[1.5rem] font-semibold tracking-[0.1em] text-white leading-none mb-2">
              {BRAND.wordmark}
            </h1>
            <p className="text-zinc-500 text-[13px] leading-relaxed max-w-[240px]">
              {BRAND.login.subtitle}
            </p>
          </div>
        </div>

        {/* Sign-in card */}
        <div className="relative w-full">
          <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.16),transparent_68%)] blur-2xl opacity-60" />
          <div className="pointer-events-none absolute inset-x-10 -top-3 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-10 -bottom-3 h-px bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent" />

          <div
            className="relative brand-panel w-full rounded-2xl p-6"
            style={{
              background: 'linear-gradient(160deg, #1c1c1f 0%, #141416 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow:
                '0 0 0 1px rgba(0,0,0,0.6), 0 24px 64px -12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <button
              onClick={handleGoogleSignIn}
              disabled={!isLoaded || isLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-[10px] font-medium text-[14px] text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed brand-button-secondary"
              style={{
                backgroundColor: '#1a2522',
                border: '1px solid #2f4740',
              }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = '#223330'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1a2522'; }}
            >
              {isLoading ? (
                <span className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {isLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer — satisfies Google's requirement for a visible privacy policy link */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
        <a
          href="/privacy"
          className="text-zinc-600 hover:text-zinc-400 text-[11px] transition-colors"
        >
          Privacy Policy
        </a>
        <span className="text-zinc-800 text-[11px]">·</span>
        <a
          href="/terms"
          className="text-zinc-600 hover:text-zinc-400 text-[11px] transition-colors"
        >
          Terms of Service
        </a>
      </div>
    </div>
  );
}
