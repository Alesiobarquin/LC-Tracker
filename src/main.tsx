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
  variables: {
    colorBackground: 'var(--palette-surface)',
    colorInputBackground: 'var(--palette-canvas)',
    colorText: 'var(--palette-foreground)',
    colorTextSecondary: 'var(--palette-muted)',
    colorPrimary: 'var(--palette-accent)',
    colorDanger: 'var(--palette-danger)',
    colorInputText: 'var(--palette-foreground)',
    colorNeutral: 'var(--palette-subtle)',
    borderRadius: '0.375rem',
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    card: 'bg-surface border border-line shadow-lg',
    navbar: 'bg-surface border-line',
    navbarButton: 'text-body hover:text-foreground',
    headerTitle: 'text-foreground',
    headerSubtitle: 'text-muted',
    socialButtonsBlockButton: 'bg-canvas border border-line hover:bg-muted-surface text-foreground',
    socialButtonsBlockButtonText: 'text-foreground font-semibold',
    dividerLine: 'bg-muted-surface',
    dividerText: 'text-subtle',
    formFieldLabel: 'text-body',
    formFieldInput: 'bg-canvas border border-line text-foreground',
    formButtonPrimary: 'bg-accent hover:bg-accent-strong text-on-accent font-bold',
    footerActionText: 'text-muted',
    footerActionLink: 'text-accent hover:text-accent',
    identityPreviewText: 'text-body',
    identityPreviewEditButtonIcon: 'text-accent',
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
                appearance={clerkAppearance}
              >
                <ErrorBoundary>
                  <Suspense fallback={<div role="status" className="min-h-screen bg-canvas text-muted flex items-center justify-center">Loading LC Tracker…</div>}>
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
