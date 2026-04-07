import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProblemLibrary } from './components/ProblemLibrary';
import { PatternFoundations } from './components/PatternFoundations';
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
import { isAdminUser } from './utils/adminAuth';

function RealtimeSyncHost({ userId }: { userId: string | null }) {
  useRealtimeSync(userId);
  return null;
}

function updateMeta(attribute: 'name' | 'property', value: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function updateCanonical(href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

export default function App() {
  const { onboardingComplete, isLoading: settingsLoading, error: settingsError } = useUserSettings();
  const { user, isLoaded: authLoaded } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const rawPath = location.pathname;
  const path = rawPath === '/' ? rawPath : rawPath.replace(/\/+$/, '');

  const handleOnboardingComplete = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    const origin = window.location.origin;
    const pageConfig = {
      '/': {
        title: 'LC Tracker | LeetCode Tracker for Spaced Repetition',
        description: 'LC Tracker is a LeetCode tracker for spaced repetition. Track sessions, expose weak patterns, and schedule reviews to improve interview retention.',
        canonical: `${origin}/`,
        robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      },
      '/login': {
        title: 'Sign In | LC Tracker',
        description: 'Sign in to LC Tracker to continue tracking LeetCode sessions, review scheduling, and interview prep workflows.',
        canonical: `${origin}/login`,
        robots: 'noindex,nofollow',
      },
      '/privacy': {
        title: 'Privacy Policy | LC Tracker',
        description: 'Read the LC Tracker privacy policy and learn how user data is collected, stored, and protected.',
        canonical: `${origin}/privacy`,
        robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      },
      '/terms': {
        title: 'Terms of Service | LC Tracker',
        description: 'Review the LC Tracker terms of service and usage guidelines for the LeetCode tracker web app.',
        canonical: `${origin}/terms`,
        robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      },
      '/sso-callback': {
        title: 'Signing In | LC Tracker',
        description: 'Completing LC Tracker sign in and authentication.',
        canonical: `${origin}/sso-callback`,
        robots: 'noindex,nofollow',
      },
      '/admin': {
        title: 'Admin | LC Tracker',
        description: 'LC Tracker admin dashboard.',
        canonical: `${origin}/admin`,
        robots: 'noindex,nofollow',
      },
    } as const;

    const config = pageConfig[path as keyof typeof pageConfig] ?? pageConfig['/'];

    document.title = config.title;
    updateMeta('name', 'description', config.description);
    updateMeta('name', 'robots', config.robots);
    updateMeta('name', 'application-name', 'LC Tracker');
    updateMeta('property', 'og:title', config.title);
    updateMeta('property', 'og:description', config.description);
    updateMeta('property', 'og:url', config.canonical);
    updateMeta('property', 'og:image', `${origin}/og-image.svg`);
    updateMeta('property', 'og:image:width', '1200');
    updateMeta('property', 'og:image:height', '630');
    updateMeta('property', 'og:image:type', 'image/svg+xml');
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'twitter:title', config.title);
    updateMeta('name', 'twitter:description', config.description);
    updateMeta('name', 'twitter:image', `${origin}/og-image.svg`);
    updateCanonical(config.canonical);
  }, [path]);

  // Public routes — no auth needed
  if (path === '/privacy') return <PrivacyPolicy />;
  if (path === '/terms') return <TermsOfService />;
  if (path === '/sso-callback') return <AuthenticateWithRedirectCallback />;

  // Landing page — show immediately without waiting for auth
  if (path === '/' && authLoaded && !user) return <LandingPage />;

  // Prevent logged in users from seeing the landing page if they try to access '/'
  if (path === '/' && user && onboardingComplete) return <Navigate to="/dashboard" replace />;

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

  // Public application routes
  const publicAppRoutes = ['/patterns', '/library', '/syntax'];
  const isPublicAppRoute = publicAppRoutes.includes(path);

  // Not logged in — /login shows the sign-in widget, allow public app routes, everything else goes to landing
  if (!user) {
    if (path === '/login') return <Login />;
    if (!isPublicAppRoute) return <Navigate to="/" replace />;
  }

  if (path === '/admin') {
    if (isAdminUser(user)) {
      return (
        <>
          <RealtimeSyncHost userId={user.id} />
          <AdminDashboard />
        </>
      );
    } else {
      return <Navigate to="/" replace />;
    }
  }

  if (user && !onboardingComplete) {
    if (path !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }
    return (
      <>
        <RealtimeSyncHost userId={user.id} />
        <Onboarding onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return (
    <>
      <RealtimeSyncHost userId={user?.id || null} />
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
          
          {/* Protected routes */}
          {user && (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/mock" element={<MockInterview />} />
              <Route path="/settings" element={<Settings />} />
            </>
          )}
          
          {/* Publicly indexable/previewable paths */}
          <Route path="/patterns" element={<PatternFoundations />} />
          <Route path="/library" element={<ProblemLibrary />} />
          <Route path="/syntax" element={<SyntaxReference />} />
          
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
        </Routes>
      </Layout>
    </>
  );
}
