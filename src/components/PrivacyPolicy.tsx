import React from 'react';
import { Shield } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-8 sm:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-6 mb-8">
          <Shield className="w-8 h-8 text-emerald-500" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none">
          <p className="text-zinc-400">Last updated: March 26, 2026</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to LC Tracker ("we", "our", or "us"). We are committed to protecting your personal
            information and your right to privacy. This Privacy Policy explains how we collect, use, and
            share information about you when you use our website at https://lc-tracker.app (the "Service"),
            a LeetCode progress tracking and spaced-repetition review application.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Information We Collect</h2>
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
            in our database to persist your progress across sessions and devices.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use the information we collect solely to provide and improve the Service:</p>
          <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
            <li>To authenticate your identity and manage your account via Google Sign-In.</li>
            <li>To store and sync your problem-solving progress and review schedule.</li>
            <li>To display your analytics, streaks, and performance history within the app.</li>
          </ul>
          <p className="mt-4">
            We do not use your Google account data for advertising, profiling, or any purpose beyond
            operating the Service.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Google API Data Disclosure</h2>
          <p>
            LC Tracker's use of information received from Google APIs adheres to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. Specifically:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
            <li>We only request your name and email address (the <code>openid</code>, <code>email</code>, and <code>profile</code> scopes).</li>
            <li>We do not transfer your Google data to third parties except as necessary to operate the Service.</li>
            <li>We do not use your Google data for serving advertisements.</li>
            <li>We do not allow humans to read your Google data unless required by law or you have given explicit permission.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Sharing Your Information</h2>
          <p>
            We do not sell, trade, or rent your personal information. We share data only with the
            following services required to operate the app:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
            <li><strong>Clerk (clerk.com):</strong> Handles authentication and Google OAuth sign-in on our behalf.</li>
            <li><strong>Supabase (supabase.com):</strong> Hosts our database where your progress data is stored securely.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Revoking Access</h2>
          <p>
            You can revoke LC Tracker's access to your Google account at any time by visiting your{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Google Account permissions page
            </a>{' '}
            and removing LC Tracker. You may also delete your account and all associated data by
            contacting us at the email below.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Data Security</h2>
          <p>
            Your data is secured using industry-standard practices including HTTPS encryption and secure
            database configurations. However, no method of transmission over the internet can be
            guaranteed 100% secure.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to request deletion of your data,
            please contact us at:{' '}
            <a href="mailto:alesiobarquin@gmail.com" className="text-emerald-400 hover:text-emerald-300">
              alesio1610@gmail.com
            </a>
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <a href="/" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
            &larr; Return to Application
          </a>
        </div>
      </div>
    </div>
  );
}
