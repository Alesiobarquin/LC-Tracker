import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useProblemProgress } from '../hooks/useUserData';
import { problemMap } from '../data/problems';
import { Timer } from './Timer';

export const TimerPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const location = useLocation();
  const activeSession = useStore((state) => state.activeSession);
  const sessionReturnTo = useStore((state) => state.sessionReturnTo);
  const clearSessionReturnTo = useStore((state) => state.clearSessionReturnTo);
  const startSession = useStore((state) => state.startSession);
  const { progress, isLoading: progressLoading } = useProblemProgress();
  const navigate = useNavigate();

  const targetProblemId = problemId || activeSession?.problemId;
  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ||
    sessionReturnTo ||
    '/library';

  useEffect(() => {
    if (!targetProblemId || progressLoading) return;
    const problem = problemMap[targetProblemId];
    if (!problem) return;
    if (!activeSession || activeSession.problemId !== targetProblemId) {
      startSession(problem.id, Boolean(progress[problem.id]), false, Date.now(), returnTo);
    }
  }, [activeSession, progress, progressLoading, returnTo, startSession, targetProblemId]);

  if (!targetProblemId) {
    return <Navigate to="/library" replace />;
  }

  const problem = problemMap[targetProblemId];
  if (!problem) {
    // Clear orphaned persisted sessions so refresh doesn't loop on a blank timer.
    if (activeSession?.problemId === targetProblemId) {
      useStore.getState().abandonSession();
    }
    return <Navigate to="/library" replace />;
  }

  if ((progressLoading && !activeSession) || !activeSession || activeSession.problemId !== targetProblemId) {
    return (
      <div className="animate-in fade-in duration-500 w-full max-w-4xl mx-auto py-8 flex items-center justify-center min-h-[40vh]">
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
          <span className="sr-only">Loading session</span>
        </div>
      </div>
    );
  }

  const isNew = !activeSession.isReview && !activeSession.isColdSolve;

  return (
    <div className="animate-in fade-in duration-500 w-full max-w-4xl mx-auto py-8">
      <Timer
        problem={problem}
        isNew={isNew}
        isColdSolve={activeSession.isColdSolve}
        onComplete={() => {
          const destination = returnTo || '/library';
          clearSessionReturnTo();
          navigate(destination);
        }}
      />
    </div>
  );
};
