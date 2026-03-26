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
          <p className="text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to LC-Tracker ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains how we collect, use, and share information about you when you use our website and application (the "Service").
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Information We Collect</h2>
          <p>
            <strong>Account Information:</strong> When you sign in using Google Authentication via Supabase, we collect your basic profile information (such as your name and email address) necessary to create and manage your account.
          </p>
          <p>
            <strong>Usage Data:</strong> We store the coding problems you track, your sprint progress, Mock Interview logs, and customized user settings. This data syncs to our database and your device's local storage to provide a seamless experience.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use the information we collect entirely to provide and improve the Service:</p>
          <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
            <li>To manage your account and authenticate your sign-in.</li>
            <li>To persist your progress and analytics across devices.</li>
            <li>To communicate with you regarding service updates (only if necessary).</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Sharing Your Information</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We only share information with minimal third-party services required to operate the app:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
            <li><strong>Supabase:</strong> For secure database hosting and Google OAuth authentication.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Data Security</h2>
          <p>
            Your data is secured using industry-standard practices, including HTTPS encryption and secure database configurations handled by Supabase. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Contact Us</h2>
          <p>
            If you have questions or comments about this notice, you can contact us directly through the Support/Feedback section within the application.
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
