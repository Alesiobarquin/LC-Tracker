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
import { useStore } from './store/useStore';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const onboardingComplete = useStore((s) => s.onboardingComplete);

  const handleOnboardingComplete = () => {
    setActiveTab('dashboard');
  };

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
