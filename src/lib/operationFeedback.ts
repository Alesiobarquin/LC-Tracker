import { captureException } from '@sentry/react';

export const OPERATION_ERROR_EVENT = 'lc-tracker:operation-error';
export function reportOperationError(error: unknown, operation = 'operation') {
  const code = (error as { code?: string })?.code ?? 'unknown';
  console.error(`${operation} failed`, { code });
  captureException(new Error(`${operation} failed (${code})`), { tags: { operation, code } });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPERATION_ERROR_EVENT, {
      detail: { message: operation === 'load' ? 'Could not load your data. Check your connection and retry.'
        : code === '40001' ? 'Your data changed on another device. Refresh and try again.'
        : 'Could not confirm your change. Check your connection and try again.' },
    }));
  }
}

/** Preserve awaitable rejection while handling callers that intentionally ignore the promise. */
export function observeMutation<T>(promise: Promise<T>): Promise<T> {
  void promise.catch(() => {});
  return promise;
}
