import React from 'react';
import { FileText } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-8 sm:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-6 mb-8">
          <FileText className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Terms of Service</h1>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none">
          <p className="text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using LC-Tracker (the "Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Account Registration</h2>
          <p>
            You must register for an account using Google OAuth to access the full features of the Service. You are responsible for safeguarding the password and credentials that you use to access the Service and for any activities or actions under your account.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Acceptable Use</h2>
          <p>
            You agree not to use the Service in any way that is unlawful, illegal, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity. You must not use the Service to copy, store, host, transmit, send, use, publish, or distribute any material which consists of (or is linked to) any spyware, computer virus, or other malicious software.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of LC-Tracker and its licensors. The Service is protected by copyright, trademark, and other laws. Note that LeetCode problems and content remain the intellectual property of LeetCode, and we do not claim ownership over external problem descriptions used for personal study purposes.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Disclaimer of Warranties</h2>
          <p>
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Limitation of Liability</h2>
          <p>
            In no event shall LC-Tracker, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Changes</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <a href="/" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
            &larr; Return to Application
          </a>
        </div>
      </div>
    </div>
  );
}
