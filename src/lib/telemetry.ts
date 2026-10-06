import * as Sentry from '@sentry/react';

export function initializeTelemetry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn, environment: import.meta.env.MODE, release: import.meta.env.VITE_APP_VERSION,
    // No session replay or performance tracing of study activity.
    tracesSampleRate: 0,
    beforeBreadcrumb: () => null,
    beforeSend(event) {
      delete event.request;
      delete event.user;
      delete event.extra;
      // Runtime errors may contain URLs, answers, or database values.
      for (const value of event.exception?.values ?? []) value.value = 'Application error';
      event.message = event.message ? 'Application error' : undefined;
      return event;
    },
  });
}
