/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProblemLibrary } from './components/ProblemLibrary';
import { Analytics } from './components/Analytics';
import { MockInterview } from './components/MockInterview';
import { SyntaxReference } from './components/SyntaxReference';
import { Settings } from './components/Settings';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { useAuth } from './components/AuthProvider';
import { useUserSettings } from './hooks/useUserData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { onboardingComplete } = useUserSettings();
  const { session, loading } = useAuth();

  const handleOnboardingComplete = () => {
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="h-1 w-full bg-zinc-900 border-b border-zinc-800">
          <div className="h-full w-1/3 bg-emerald-500/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'library' && <ProblemLibrary />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'mock' && <MockInterview />}
        {activeTab === 'syntax' && <SyntaxReference />}
        {activeTab === 'settings' && <Settings />}
      </Layout>

      {!onboardingComplete && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
    </>
  );
}
