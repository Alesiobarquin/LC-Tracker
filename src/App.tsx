import React, { Suspense, useEffect, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { Logo } from './components/Logo';
import { useUser, AuthenticateWithRedirectCallback } from '@clerk/react';
import { useUserSettings } from './hooks/useUserData';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { isAdminUser } from './utils/adminAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store/useStore';
import { queryClient } from './lib/queryClient';
import { userDataQueryKeys } from './lib/userDataQueryKeys';
import { PublicPageFallback } from './components/PublicPageFallback';
import { NotFound } from './components/NotFound';

const ExplanationDirectory = lazy(() => import('./components/ExplanationDirectory').then(m => ({ default: m.ExplanationDirectory })));
const StudyPlanGuide = lazy(() => import('./components/StudyPlanGuide').then(m => ({ default: m.StudyPlanGuide })));
const Dashboard = lazy(() => import('./components/Dashboard').then((m) => ({ default: m.Dashboard })));
const ProblemLibrary = lazy(() => import('./components/ProblemLibrary').then((m) => ({ default: m.ProblemLibrary })));
const PatternFoundations = lazy(() => import('./components/PatternFoundations').then((m) => ({ default: m.PatternFoundations })));
const Analytics = lazy(() => import('./components/Analytics').then((m) => ({ default: m.Analytics })));
const SyntaxReference = lazy(() => import('./components/SyntaxReference').then((m) => ({ default: m.SyntaxReference })));
const Settings = lazy(() => import('./components/Settings').then((m) => ({ default: m.Settings })));
const Onboarding = lazy(() => import('./components/Onboarding').then((m) => ({ default: m.Onboarding })));
const RecallPage = lazy(() => import('./components/RecallPage').then(m => ({ default: m.RecallPage })));
const ExplanationPage = lazy(() => import('./components/ExplanationPage').then(m => ({ default: m.ExplanationPage })));
const TimerPage = lazy(() => import('./components/TimerPage').then((m) => ({ default: m.TimerPage })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));

function RouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-subtle" role="status">
      Loading…
    </div>
  );
}

function RealtimeSyncHost({ userId }: { userId: string | null }) {
  useRealtimeSync(userId);
  return null;
}

export default function App() {
  const { onboardingComplete, isLoading: settingsLoading, error: settingsError } = useUserSettings();
  const { user, isLoaded: authLoaded } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const rawPath = location.pathname;
  const path = rawPath === '/' ? rawPath : rawPath.replace(/\/+$/, '');
  const [bootTimedOut, setBootTimedOut] = React.useState(false);
  const previousUserId = React.useRef<string | null>(null);

  useEffect(() => {
    if (!authLoaded) return;
    const userId = user?.id ?? null;
    if (previousUserId.current && previousUserId.current !== userId) {
      for (const key of Object.values(userDataQueryKeys)) {
        const queryKey = key(previousUserId.current);
        void queryClient.cancelQueries({ queryKey });
        queryClient.removeQueries({ queryKey });
      }
    }
    previousUserId.current = userId;
    useStore.getState().setSessionUser(userId);
  }, [authLoaded, user?.id]);

  const handleOnboardingComplete = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setBootTimedOut(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void import('./seo/metadata').then(async ({ getPageMetadata, applyMetadata }) => {
      const metadata = await getPageMetadata(path);
      if (!cancelled) applyMetadata(metadata);
    });
    return () => { cancelled = true; };
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

  if (showLoading && isPublicAppRoute) return <PublicPageFallback />;

  if (showLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4 animate-in">
          <div className="p-4 bg-surface rounded-full border border-line shadow-lg shadow-accent/10">
            <Logo className="text-accent " size={40} />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-foreground">LC Tracker</h1>
            <p className="text-sm text-subtle">Loading your workspace…</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
        </div>
      </div>
    );
  }

  // Not logged in — /login shows the sign-in widget, allow public app routes, everything else goes to landing
  if (!user) {
    if (path === '/login') return <Login />;
    if (!isPublicAppRoute) {
      const isPrivateRoute = /^\/(dashboard|study-plan|analytics|settings|onboarding|admin|timer|recall)(\/|$)/.test(path);
      return isPrivateRoute ? <Navigate to="/" replace /> : <NotFound />;
    }
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
  // Also wait until settings finished loading so a hung/timeout boot doesn't trap users in onboarding.
  if (user && !onboardingComplete && !settingsError && !settingsLoading) {
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
    <ErrorBoundary>
      <RealtimeSyncHost userId={user?.id || null} />
      <Layout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />

            {/* Protected routes */}
            {user && (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/study-plan" element={<StudyPlanGuide />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/recall/:problemId" element={<RecallPage />} />
                <Route path="/timer" element={<TimerPage />} />
                <Route path="/timer/:problemId" element={<TimerPage />} />
              </>
            )}

            {/* Publicly indexable/previewable paths */}
            <Route path="/patterns/*" element={<PatternFoundations />} />
            <Route path="/library" element={<ProblemLibrary />} />
            <Route path="/library/explanations" element={<ExplanationDirectory />} />
            <Route path="/library/:problemId/explanation" element={<ExplanationPage />} />
            <Route path="/syntax" element={<SyntaxReference />} />

            <Route path="*" element={<NotFound embedded />} />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}
