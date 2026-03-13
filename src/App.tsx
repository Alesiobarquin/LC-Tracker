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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'library' && <ProblemLibrary />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'mock' && <MockInterview />}
      {activeTab === 'syntax' && <SyntaxReference />}
    </Layout>
  );
}
