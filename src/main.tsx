import {StrictMode} from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import { queryClient } from './lib/queryClient';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider 
          publishableKey={clerkPubKey || ''} 
          afterSignOutUrl="/"
          appearance={clerkAppearance}
        >
          <App />
        </ClerkProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
