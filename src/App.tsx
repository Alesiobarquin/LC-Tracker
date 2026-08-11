import React, { Suspense, useEffect, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { Logo } from './components/Logo';
import { useUser, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useUserSettings } from './hooks/useUserData';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { isAdminUser } from './utils/adminAuth';

const Dashboard = lazy(() => import('./components/Dashboard').then((m) => ({ default: m.Dashboard })));
const ProblemLibrary = lazy(() => import('./components/ProblemLibrary').then((m) => ({ default: m.ProblemLibrary })));
const PatternFoundations = lazy(() => import('./components/PatternFoundations').then((m) => ({ default: m.PatternFoundations })));
const Analytics = lazy(() => import('./components/Analytics').then((m) => ({ default: m.Analytics })));
const SyntaxReference = lazy(() => import('./components/SyntaxReference').then((m) => ({ default: m.SyntaxReference })));
const Settings = lazy(() => import('./components/Settings').then((m) => ({ default: m.Settings })));
const Onboarding = lazy(() => import('./components/Onboarding').then((m) => ({ default: m.Onboarding })));
const TimerPage = lazy(() => import('./components/TimerPage').then((m) => ({ default: m.TimerPage })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));

function RouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-zinc-500" role="status">
      Loading…
    </div>
  );
}

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
  const [bootTimedOut, setBootTimedOut] = React.useState(false);

  const handleOnboardingComplete = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setBootTimedOut(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const origin = window.location.origin;
    const pageConfig = {
      '/': {
        title: 'LC Tracker | LeetCode Tracker for Spaced Repetition',
        description: 'LC Tracker is a LeetCode tracker for spaced repetition. Track sessions, expose weak patterns, and schedule reviews to improve interview retention.',
        canonical: `${origin}/`,
        robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      },
      '/library': {
        title: 'Problem Library | LC Tracker',
        description: 'Browse the LC Tracker problem library by category, difficulty, and curated sets to plan your interview prep.',
        canonical: `${origin}/library`,
        robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      },
      '/patterns': {
        title: 'Pattern Foundations | LC Tracker',
        description: 'Explore algorithm patterns, templates, and mapped LeetCode problems in the LC Tracker pattern roadmap.',
        canonical: `${origin}/patterns`,
        robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      },
      '/syntax': {
        title: 'Syntax Reference | LC Tracker',
        description: 'Review Python interview syntax flashcards and weak areas in the LC Tracker syntax reference.',
        canonical: `${origin}/syntax`,
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

    const config = path.startsWith('/patterns/')
      ? {
          ...pageConfig['/patterns'],
          canonical: `${origin}${path}`,
        }
      : (pageConfig[path as keyof typeof pageConfig] ?? pageConfig['/']);

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

  // Landing: render immediately so guests never sit on an empty dark splash
  // while Clerk boots. Logged-in users redirect once auth resolves.
  if (path === '/' && (!authLoaded || !user)) return <LandingPage />;

  // Prevent logged in users from seeing the landing page if they try to access '/'
  if (path === '/' && user && onboardingComplete) return <Navigate to="/dashboard" replace />;

  // Auth loading state — bail out of loading if settings errored (prevents infinite hang)
  // Also don't block public app routes on settings fetch for signed-in users.
  const publicAppRoutes = ['/patterns', '/library', '/syntax'];
  const isPublicAppRoute = publicAppRoutes.some(r => path === r || path.startsWith(`${r}/`));
  const showLoading =
    !bootTimedOut &&
    (!authLoaded || (user && settingsLoading && !settingsError && !isPublicAppRoute));

  if (showLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4 animate-in">
          <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800 shadow-lg shadow-emerald-500/10">
            <Logo className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={40} />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-zinc-50">LC Tracker</h1>
            <p className="text-sm text-zinc-500">Loading your workspace…</p>
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
          <Suspense fallback={<RouteFallback />}>
            <AdminDashboard />
          </Suspense>
        </>
      );
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // Settings fetch failed — don't force onboarding with default incomplete settings.
  // Fall through to the app shell so the user isn't trapped in a re-onboarding loop.
  if (user && !onboardingComplete && !settingsError) {
    if (path !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }
    return (
      <>
        <RealtimeSyncHost userId={user.id} />
        <Suspense fallback={<RouteFallback />}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </Suspense>
      </>
    );
  }

  return (
    <>
      <RealtimeSyncHost userId={user?.id || null} />
      <Layout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />

            {/* Protected routes */}
            {user && (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/timer" element={<TimerPage />} />
                <Route path="/timer/:problemId" element={<TimerPage />} />
              </>
            )}

            {/* Publicly indexable/previewable paths */}
            <Route path="/patterns/*" element={<PatternFoundations />} />
            <Route path="/library" element={<ProblemLibrary />} />
            <Route path="/syntax" element={<SyntaxReference />} />

            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}
