import React from 'react';
import { Shield } from 'lucide-react';
import { PublicHeader } from './PublicHeader';
import { BRAND } from '../constants/brand';

const SECTIONS = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information-we-collect', title: '2. Information We Collect' },
  { id: 'how-we-use', title: '3. How We Use Your Information' },
  { id: 'google-api', title: '4. Google API Data Disclosure' },
  { id: 'sharing', title: '5. Sharing Your Information' },
  { id: 'revoking', title: '6. Revoking Access' },
  { id: 'data-retention', title: '7. Data Retention & Deletion' },
  { id: 'security', title: '8. Security' },
  { id: 'contact', title: '9. Contact' },
  { id: 'study-chat', title: '10. Study chat' },
] as const;

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-canvas text-body font-sans selection:bg-accent/30">
      <PublicHeader />

      <div className="max-w-3xl mx-auto space-y-8 p-8 sm:p-12">
        <div className="flex items-center gap-3 border-b border-line pb-6">
          <Shield className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Privacy Policy</h1>
            <p className="text-subtle text-sm mt-1">Last updated November 18, 2026</p>
          </div>
        </div>

        <nav aria-label="On this page" className="flex flex-wrap gap-2">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="px-3 py-1.5 rounded-lg border border-line bg-surface/60 text-xs text-muted hover:text-accent hover:border-accent/30"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="prose prose-invert prose-zinc max-w-none space-y-6">
          <section id="introduction" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p>
              Welcome to LC Tracker ("we", "our", or "us"). We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy explains how we collect, use, and
              share information about you when you use our website at https://lc-tracker.app (the "Service"),
              a LeetCode progress tracking and spaced-repetition review application.
            </p>
          </section>

          <section id="information-we-collect" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <p>
              <strong>Email and password accounts.</strong> Clerk uses your email address to verify your
              account and help you recover access. Clerk manages passwords. LC Tracker uses your Clerk
              account ID to identify your study data.
            </p>
            <p>
              <strong>Google Account Information:</strong> When you sign in using Google OAuth, we receive
              your basic Google profile information — specifically your name, email address, and Google
              account ID. This is the only data we receive from Google and it is used solely to create and
              identify your account. We do not access your Gmail, Google Drive, Google Contacts, or any
              other Google service data.
            </p>
            <p>
              <strong>Usage Data:</strong> We store the LeetCode problems you track, your solve history,
              spaced-repetition review progress, mock interview logs, and user settings. This data is stored
              in our database to persist your progress across sessions and devices. Notes you write may
              contain sensitive content — export backups carefully.
            </p>
          </section>

          <section id="how-we-use" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect solely to provide and improve the Service:</p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>To authenticate your identity and manage your account through Clerk.</li>
              <li>To store and sync your problem-solving progress and review schedule.</li>
              <li>To display your analytics, streaks, and performance history within the app.</li>
            </ul>
            <p className="mt-4">
              We do not use your Google account data for advertising, profiling, or any purpose beyond
              operating the Service.
            </p>
          </section>

          <section id="google-api" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Google API Data Disclosure</h2>
            <p>
              LC Tracker&apos;s use of information received from Google APIs adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section id="sharing" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Sharing Your Information</h2>
            <p>
              We do not sell, trade, or rent your personal information. Clerk handles authentication
              and Supabase hosts study data. When you send an AI question in Study Chat, the
              service sends the limited data described below.
            </p>
          </section>

          <section id="revoking" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Revoking Access</h2>
            <p>
              You can revoke LC Tracker&apos;s access to your Google account at any time via your Google
              Account permissions page. You may also request account deletion by contacting us.
            </p>
          </section>

          <section id="data-retention" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention &amp; Deletion</h2>
            <p>
              Progress data is retained while your account is active. You can export a JSON backup from
              Settings at any time. Upon account deletion we remove associated progress data from our systems.
            </p>
          </section>

          <section id="security" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Security</h2>
            <p>
              We use industry-standard protections appropriate for a study tracker. No method of transmission
              over the Internet is 100% secure.
            </p>
          </section>

          <section id="contact" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact</h2>
            <p>
              Questions about this policy can be sent through the in-app feedback channel or the project
              GitHub repository.
            </p>
          </section>

          <section id="study-chat" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Study chat</h2>
            <p>
              When you send an AI question, the selected provider receives your message and limited
              recent chat context. A follow-up call may include selected study facts such as problem
              titles, elapsed time, and reported outcomes. Built-in Study Chat shortcuts run inside
              LC Tracker.
            </p>
            <p className="mt-4">
              Free AI questions run through LC Tracker and OpenRouter on Microsoft Azure. If you
              supply an OpenRouter key, your browser sends the requests directly and uses your
              OpenRouter balance. Gemini and Claude requests go through LC Tracker to Google or
              Anthropic and use the provider account that issued your key. Their handling of
              requests is described in the{' '}
              <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                OpenRouter Privacy Policy
              </a>,{' '}
              <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                Gemini API Terms
              </a>, and{' '}
              <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                Anthropic Privacy Policy
              </a>.
            </p>
            <p className="mt-4">
              LC Tracker keeps the conversation and your personal key in tab memory. Refresh or
              disconnect to clear them. You can revoke the key with your provider. LC Tracker
              keeps private accounting records for the authenticated route, including your account
              ID, turn timing and usage, to enforce allowances and reconcile costs. It removes records
              older than 35 days when new turns are admitted.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
