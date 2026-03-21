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
import { useStore } from './store/useStore';
import { useAuth } from './components/AuthProvider';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const onboardingComplete = useStore((s) => s.onboardingComplete);
  const { session, loading } = useAuth();

  const handleOnboardingComplete = () => {
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
