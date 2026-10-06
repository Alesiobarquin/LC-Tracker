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
    colorBackground: '#09090b',
    colorInputBackground: '#09090b',
    colorText: '#fafafa',
    colorTextSecondary: '#a1a1aa',
    colorPrimary: '#10b981',
    colorDanger: '#ef4444',
    colorInputText: '#fafafa',
    colorNeutral: '#71717a',
    borderRadius: '0.75rem',
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    card: 'bg-zinc-900 border border-zinc-800 shadow-2xl',
    navbar: 'bg-zinc-900 border-zinc-800',
    navbarButton: 'text-zinc-300 hover:text-zinc-50',
    headerTitle: 'text-zinc-50',
    headerSubtitle: 'text-zinc-400',
    socialButtonsBlockButton: 'bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-50',
    socialButtonsBlockButtonText: 'text-zinc-50 font-semibold',
    dividerLine: 'bg-zinc-800',
    dividerText: 'text-zinc-500',
    formFieldLabel: 'text-zinc-300',
    formFieldInput: 'bg-zinc-950 border border-zinc-800 text-zinc-50',
    formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold',
    footerActionText: 'text-zinc-400',
    footerActionLink: 'text-emerald-400 hover:text-emerald-300',
    identityPreviewText: 'text-zinc-300',
    identityPreviewEditButtonIcon: 'text-emerald-400',
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {configErrors.length ? (
        <div role="alert" className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center gap-4 p-6">
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
              <Suspense fallback={<div role="status" className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center">Loading LC Tracker…</div>}>
                <App />
              </Suspense>
              <OperationErrorBanner />
            </ErrorBoundary>
          </ClerkProvider>
        </QueryClientProvider>
      </BrowserRouter>
      )}
    </ErrorBoundary>
  </StrictMode>,
);
