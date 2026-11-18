import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/react';
import { configurationErrors } from './lib/configuration';
import { initializeTelemetry } from './lib/telemetry';
import { OperationErrorBanner } from './components/OperationErrorBanner';
import { queryClient } from './lib/queryClient';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './components/ThemeProvider';
import { PublicPageFallback } from './components/PublicPageFallback';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const configErrors = configurationErrors({ clerk: clerkPubKey,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL, supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY });
initializeTelemetry();
const App = lazy(() => import('./App.tsx'));

if (!clerkPubKey) {
  console.error("Missing Clerk Publishable Key in environment variables.");
}

const clerkAppearance = {
  options: {
    elevation: 'flush',
    socialButtonsPlacement: 'bottom',
    socialButtonsVariant: 'blockButton',
    autoFocus: false,
  },
  variables: {
    colorBackground: 'var(--palette-canvas)',
    colorInput: 'var(--palette-surface)',
    colorForeground: 'var(--palette-foreground)',
    colorMutedForeground: 'var(--palette-muted)',
    colorPrimary: 'var(--palette-accent)',
    colorPrimaryForeground: 'var(--palette-on-accent)',
    colorDanger: 'var(--palette-danger)',
    colorInputForeground: 'var(--palette-foreground)',
    colorNeutral: 'var(--palette-foreground)',
    colorBorder: 'var(--palette-line-strong)',
    colorRing: 'var(--palette-accent)',
    borderRadius: '0.375rem',
    fontFamily: 'var(--font-sans)',
  },
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%', maxWidth: '100%' },
    headerTitle: 'login-heading',
    formFieldInput: 'min-h-11',
    formButtonPrimary: 'min-h-11',
    socialButtonsBlockButton: 'min-h-11',
  },
} as const;

const clerkLocalization = {
  signIn: {
    start: { title: 'Sign in to LC Tracker', subtitle: 'Open your study plan and practice history.' },
  },
  signUp: {
    start: { title: 'Create your LC Tracker account', subtitle: 'Set up a study plan and save your practice history.' },
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        {configErrors.length ? (
          <div role="alert" className="min-h-screen bg-canvas text-body flex flex-col items-center justify-center gap-4 p-6">
            <h1 className="text-xl font-bold">LC Tracker is temporarily unavailable</h1>
            <p>The site configuration needs attention. Please try again later.</p>
          </div>
        ) : (
          <BrowserRouter>
            <QueryClientProvider client={queryClient}>
              <ClerkProvider
                publishableKey={clerkPubKey || ''}
                afterSignOutUrl="/"
                signInUrl="/login"
                signUpUrl="/sign-up"
                signInFallbackRedirectUrl="/"
                signUpFallbackRedirectUrl="/"
                appearance={clerkAppearance}
                localization={clerkLocalization}
              >
                <ErrorBoundary>
                  <Suspense fallback={<PublicPageFallback />}>
                    <App />
                  </Suspense>
                  <OperationErrorBanner />
                </ErrorBoundary>
              </ClerkProvider>
            </QueryClientProvider>
          </BrowserRouter>
        )}
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
