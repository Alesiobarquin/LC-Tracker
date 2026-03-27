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
import { LandingPage } from './components/LandingPage';
import { Logo } from './components/Logo';
import { useUser, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useUserSettings } from './hooks/useUserData';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { AdminDashboard } from './components/AdminDashboard';
import { useRealtimeSync } from './hooks/useRealtimeSync';

function RealtimeSyncHost({ userId }: { userId: string | null }) {
  useRealtimeSync(userId);
  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { onboardingComplete, isLoading: settingsLoading, error: settingsError } = useUserSettings();
  const { user, isLoaded: authLoaded } = useUser();

  const handleOnboardingComplete = () => {
    setActiveTab('dashboard');
  };

  const path = window.location.pathname;

  // Public routes — no auth needed
  if (path === '/privacy') return <PrivacyPolicy />;
  if (path === '/terms') return <TermsOfService />;
  if (path === '/sso-callback') return <AuthenticateWithRedirectCallback />;

  // Landing page — show immediately without waiting for auth
  if (path === '/' && authLoaded && !user) return <LandingPage />;

  // Auth loading state — bail out of loading if settings errored (prevents infinite hang)
  const showLoading = !authLoaded || (user && settingsLoading && !settingsError);

  if (showLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4 animate-in">
          <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800 shadow-lg shadow-emerald-500/10">
            <Logo className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={40} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold font-mono tracking-tight text-zinc-50">LC Tracker</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
        </div>
      </div>
    );
  }

  // Not logged in — /login shows the sign-in widget, everything else goes to landing
  if (!user) {
    if (path === '/login') return <Login />;
    window.location.href = '/';
    return null;
  }

  if (path === '/admin') {
    if (user.id === import.meta.env.VITE_ADMIN_USER_ID) {
      return <AdminDashboard />;
    } else {
      window.location.href = '/';
      return null;
    }
  }

  if (!onboardingComplete) {
    return (
      <>
        <RealtimeSyncHost userId={user.id} />
        <Onboarding onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return (
    <>
      <RealtimeSyncHost userId={user.id} />
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'library' && <ProblemLibrary />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'mock' && <MockInterview />}
        {activeTab === 'syntax' && <SyntaxReference />}
        {activeTab === 'settings' && <Settings />}
      </Layout>
    </>
  );
}
