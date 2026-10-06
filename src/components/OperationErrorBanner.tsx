import { useEffect, useState } from 'react';
import { OPERATION_ERROR_EVENT } from '../lib/operationFeedback';

export function OperationErrorBanner() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    const handler = (event: Event) => setMessage((event as CustomEvent<{ message: string }>).detail.message);
    window.addEventListener(OPERATION_ERROR_EVENT, handler);
    return () => window.removeEventListener(OPERATION_ERROR_EVENT, handler);
  }, []);
  if (!message) return null;
  return <div role="alert" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[90%] rounded-xl border border-danger/30 bg-surface p-4 text-sm text-danger shadow-xl">
    <div className="flex items-center justify-between gap-4"><p>{message}</p>
      <button type="button" aria-label="Dismiss error" className="text-muted" onClick={() => setMessage(null)}>Dismiss</button>
    </div>
  </div>;
}
