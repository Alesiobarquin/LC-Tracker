import React from 'react';
import { Logo } from './Logo';
import { BarChart2, RefreshCw, BookOpen } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Logo
            className="text-emerald-400"
            size={28}
            style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.6))' }}
          />
          <span className="font-mono font-bold text-lg text-white tracking-tight">LC Tracker</span>
        </div>
        <a
          href="/login"
          className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Sign In →
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built for serious interview prep
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Master LeetCode.<br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, #34d399, #6ee7b7)',
              }}
            >
              Stay consistent.
            </span>
          </h1>

          <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
            Track every problem you solve, review them with spaced repetition before they fade,
            and watch your progress compound over time.
          </p>

          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-zinc-950 transition-all duration-150"
            style={{
              backgroundColor: '#10b981',
              boxShadow: '0 4px 24px -4px rgba(16,185,129,0.5)',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#34d399')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#10b981')}
          >
            Get Started Free
          </a>
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full mx-auto">
          {[
            {
              icon: BookOpen,
              title: 'Problem Tracking',
              description:
                'Log every problem you solve with ratings, notes, and timing. Never lose track of what you\'ve worked on.',
            },
            {
              icon: RefreshCw,
              title: 'Spaced Repetition',
              description:
                'Smart review scheduling resurfaces problems right before you\'d forget them, locking in long-term retention.',
            },
            {
              icon: BarChart2,
              title: 'Progress Analytics',
              description:
                'Streaks, heatmaps, solve velocity, and category breakdowns so you always know where to focus next.',
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-4 p-6 rounded-2xl text-left"
              style={{
                background: 'linear-gradient(160deg, #1c1c1f 0%, #141416 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-center gap-6 py-8 border-t border-zinc-900">
        <a href="/privacy" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
          Privacy Policy
        </a>
        <span className="text-zinc-800 text-xs">·</span>
        <a href="/terms" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
          Terms of Service
        </a>
      </footer>
    </div>
  );
}
