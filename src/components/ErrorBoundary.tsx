import React from 'react';
import { Logo } from './Logo';
import { reportOperationError } from '../lib/operationFeedback';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportOperationError(error, 'render');
  }

  private handleReload = () => {
    window.location.assign('/dashboard');
  };

  private handleHome = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="p-4 bg-surface rounded-full border border-line">
          <Logo className="text-accent" size={36} />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-sm text-subtle">
            The app hit an unexpected error while loading your workspace. Reloading usually clears it.
          </p>
          <p className="text-xs text-subtle font-mono break-all">{this.state.error.message}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent text-on-accent font-bold text-sm"
          >
            Reload dashboard
          </button>
          <button
            type="button"
            onClick={this.handleHome}
            className="px-5 py-2.5 rounded-xl border border-line-strong text-body hover:bg-surface font-medium text-sm"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }
}
