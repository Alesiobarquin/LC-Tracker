import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { FloatingContextBadges, MagnetCanvas, NoiseOverlay } from './LandingPage';
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
    <div 
        className="brand-shell min-h-screen text-zinc-200 selection:bg-emerald-500/30 selection:text-emerald-100 font-sans relative overflow-x-hidden flex flex-col items-center justify-center px-4"
        style={{ fontFamily: '"Plus Jakarta Sans", "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif' }}
    >
      <NoiseOverlay />
      <MagnetCanvas mode="login" />

      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.34, 0.56, 0.34], scale: [0.98, 1.04, 0.98] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1] w-[90vw] max-w-[620px] h-[260px] md:h-[360px] bg-emerald-500/14 blur-[120px] rounded-full"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1] w-[84vw] max-w-[460px] h-[200px] md:h-[280px] bg-teal-400/10 blur-[90px] rounded-full"
      />

      <FloatingContextBadges className="z-[2]" />

      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.08] backdrop-blur-xl bg-[#09090b]/60 transition-all duration-300">
        <div className="max-w-[52rem] mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-semibold text-white group">
            <motion.div
              animate={{ y: [0, -1.5, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <Logo className="text-emerald-400 group-hover:scale-110 transition-transform duration-300" size={18} />
              <div className="absolute inset-0 bg-emerald-400 blur-[8px] opacity-15 group-hover:opacity-45 transition-opacity duration-300"></div>
            </motion.div>
            <span className="tracking-tight text-base">{BRAND.name}</span>
          </a>

          <div className="flex flex-wrap items-center gap-5 justify-end">
            <a href="/library" className="hidden sm:inline-block text-xs font-medium text-zinc-400 hover:text-white transition-colors relative group">
              Library
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>
            </a>
            <a href="/patterns" className="hidden sm:inline-block text-xs font-medium text-zinc-400 hover:text-white transition-colors relative group">
              Patterns
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>
            </a>
            <a href="/syntax" className="hidden md:inline-block text-xs font-medium text-zinc-400 hover:text-white transition-colors relative group">
              Syntax
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>
            </a>
            <a href="/login" className="brand-button-primary relative group overflow-hidden px-4 py-1.5 text-xs font-semibold rounded transition-colors">
              <span className="relative z-10">{BRAND.landing.ctaPrimary}</span>
              <div className="absolute inset-0 -translate-x-[150%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
            </a>
          </div>
        </div>
        <div className="brand-scanline"></div>
      </nav>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10"
      >
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
      </motion.div>

      {/* Footer — satisfies Google's requirement for a visible privacy policy link */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4"
      >
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
      </motion.div>
    </div>
  );
}
