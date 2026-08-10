import React from 'react';
import { FileText } from 'lucide-react';
import { Logo } from './Logo';
import { BRAND } from '../constants/brand';

const SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance' },
  { id: 'registration', title: '2. Account Registration' },
  { id: 'acceptable-use', title: '3. Acceptable Use' },
  { id: 'ip', title: '4. Intellectual Property' },
  { id: 'disclaimer', title: '5. Disclaimer' },
  { id: 'liability', title: '6. Liability' },
  { id: 'changes', title: '7. Changes' },
] as const;

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-emerald-500/30">
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-zinc-100 font-semibold">
            <Logo className="text-emerald-400" size={18} />
            {BRAND.name}
          </a>
          <div className="flex items-center gap-4 text-xs">
            <a href="/privacy" className="text-zinc-500 hover:text-zinc-200">Privacy</a>
            <a href="/login" className="text-emerald-400 hover:text-emerald-300">Sign in</a>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto space-y-8 p-8 sm:p-12">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-6">
          <FileText className="w-8 h-8 text-emerald-500" />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Terms of Service</h1>
            <p className="text-zinc-500 text-sm mt-1">Last updated: March 26, 2026</p>
          </div>
        </div>

        <nav aria-label="On this page" className="flex flex-wrap gap-2">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 hover:text-emerald-300 hover:border-emerald-500/30"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="prose prose-invert prose-zinc max-w-none space-y-6">
          <section id="acceptance" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using LC Tracker (the &quot;Service&quot;), you agree to be bound by these Terms of Service.
              If you disagree with any part of the terms, then you may not access the Service.
            </p>
          </section>

          <section id="registration" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Account Registration</h2>
            <p>
              You must register for an account using Google OAuth to access the full features of the Service.
              You are responsible for safeguarding the credentials that you use to access the Service and for
              any activities or actions under your account.
            </p>
          </section>

          <section id="acceptable-use" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Acceptable Use</h2>
            <p>
              You agree not to use the Service in any way that is unlawful, illegal, fraudulent, or harmful,
              or in connection with any unlawful purpose or activity.
            </p>
          </section>

          <section id="ip" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Intellectual Property</h2>
            <p>
              The Service and its original content remain the exclusive property of LC Tracker and its licensors.
              LeetCode problems and content remain the intellectual property of LeetCode.
            </p>
          </section>

          <section id="disclaimer" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind,
              whether express or implied.
            </p>
          </section>

          <section id="liability" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <p>
              In no event shall LC Tracker be liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of the Service.
            </p>
          </section>

          <section id="changes" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Changes</h2>
            <p>
              We may modify these Terms at any time. Continued use of the Service after revisions become
              effective constitutes acceptance of the revised terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
