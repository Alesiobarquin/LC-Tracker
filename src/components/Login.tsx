import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Logo } from './Logo';

export function Login() {
  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Ambient glow — gives the page depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(16,185,129,0.07) 0%, transparent 70%)',
        }}
      />

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
            <h1 className="text-[1.75rem] font-bold font-mono tracking-tight text-white leading-none mb-2">
              LC Tracker
            </h1>
            <p className="text-zinc-500 text-[13px] leading-relaxed max-w-[220px]">
              Your personal LeetCode progress companion
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #1c1c1f 0%, #141416 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow:
              '0 0 0 1px rgba(0,0,0,0.6), 0 24px 64px -12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <SignIn
            routing="hash"
            appearance={{
              variables: {
                colorBackground: '#1a1a1d',
                colorInputBackground: '#111113',
                colorText: '#f4f4f5',
                colorTextSecondary: '#71717a',
                colorPrimary: '#10b981',
                colorDanger: '#ef4444',
                colorInputText: '#f4f4f5',
                colorNeutral: '#52525b',
                borderRadius: '10px',
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                fontSize: '14px',
                spacingUnit: '16px',
              },
              elements: {
                rootBox: 'w-full',
                cardBox: 'w-full shadow-none border-0 rounded-none',
                card: 'shadow-none rounded-none p-0',
                main: 'p-6',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                header: 'hidden',
                // Social button — use a visibly lighter surface so it reads clearly
                socialButtonsBlockButton: {
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '10px',
                  height: '44px',
                  color: '#f4f4f5',
                  fontWeight: '500',
                  transition: 'background-color 0.15s, border-color 0.15s',
                },
                socialButtonsBlockButtonText: { color: '#f4f4f5', fontWeight: '500' },
                dividerLine: { backgroundColor: '#27272a' },
                dividerText: { color: '#52525b', fontSize: '11px', letterSpacing: '0.08em' },
                formFieldLabel: { color: '#a1a1aa', fontSize: '12px', fontWeight: '600', letterSpacing: '0.04em' },
                formFieldInput: {
                  backgroundColor: '#111113',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  height: '44px',
                  color: '#f4f4f5',
                },
                formButtonPrimary: {
                  backgroundColor: '#10b981',
                  borderRadius: '10px',
                  height: '44px',
                  color: '#052e16',
                  fontWeight: '600',
                  boxShadow: '0 4px 20px -4px rgba(16,185,129,0.4)',
                },
                footerAction: {
                  backgroundColor: '#111113',
                  borderTop: '1px solid #27272a',
                  padding: '14px 24px',
                },
                footerActionText: { color: '#52525b', fontSize: '12px' },
                footerActionLink: { color: '#34d399', fontWeight: '600' },
                identityPreviewText: { color: '#d4d4d8' },
                identityPreviewEditButtonIcon: { color: '#34d399' },
                // Hide the development mode badge
                badge: { display: 'none' },
                // Hide the "Secured by Clerk" footer branding in dev
                footer: { display: 'none' },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
