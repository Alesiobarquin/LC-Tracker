import { useLocation } from 'react-router-dom';
import { PublicRecallGuard } from './PublicRecallGuard';

// Preserve the public HTML while the interactive application and authentication
// load. The content comes only from our escaped, build-time React render.
const prerendered = typeof document === 'undefined' ? '' : document.querySelector('#root [data-public-page]')?.outerHTML ?? '';
const initialPath = typeof window === 'undefined' ? '' : window.location.pathname.replace(/\/+$/, '') || '/';

export function PublicPageFallback() {
  const path = useLocation().pathname.replace(/\/+$/, '') || '/';
  const guardedProblem = document.documentElement.dataset.publicRecallProblem;
  if (guardedProblem && path === `/library/${encodeURIComponent(guardedProblem)}/explanation`) {
    return <PublicRecallGuard problemId={guardedProblem} />;
  }
  return prerendered && path === initialPath
    ? <div dangerouslySetInnerHTML={{ __html: prerendered }} />
    : <p role="status" className="min-h-[40vh] flex items-center justify-center text-muted">Loading LC Tracker…</p>;
}
