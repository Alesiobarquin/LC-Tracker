import React, { useEffect, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useStore } from "../store/useStore";
import { useProblemProgress } from "../hooks/useUserData";
import { problemMap, ensureExtendedCatalogLoaded } from "../data/problems";
import { Timer } from "./Timer";
import { QueryErrorBanner } from "./ui";

export const TimerPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const location = useLocation();
  const activeSession = useStore((state) => state.activeSession);
  const activeRecall = useStore((state) => state.activeRecall);
  const sessionReturnTo = useStore((state) => state.sessionReturnTo);
  const clearSessionReturnTo = useStore((state) => state.clearSessionReturnTo);
  const startSession = useStore((state) => state.startSession);
  const {
    progress,
    isLoading: progressLoading,
    error,
    refetch,
  } = useProblemProgress();
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    void ensureExtendedCatalogLoaded()
      .then(() => setCatalogReady(true))
      .catch(() => setCatalogError(true));
  }, []);

  const targetProblemId = problemId || activeSession?.problemId;
  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ||
    sessionReturnTo ||
    "/library";

  useEffect(() => {
    if (
      !targetProblemId ||
      progressLoading ||
      error ||
      !catalogReady ||
      activeSession ||
      activeRecall
    )
      return;
    const problem = problemMap[targetProblemId];
    if (!problem) return;
    startSession(
      problem.id,
      Boolean(progress[problem.id]),
      false,
      Date.now(),
      returnTo,
    );
  }, [
    activeSession,
    activeRecall,
    progress,
    progressLoading,
    error,
    catalogReady,
    returnTo,
    startSession,
    targetProblemId,
  ]);

  if (activeRecall)
    return <Navigate to={`/recall/${activeRecall.problemId}`} replace />;
  if (activeSession && targetProblemId !== activeSession.problemId)
    return <Navigate to={`/timer/${activeSession.problemId}`} replace />;
  if (error || catalogError)
    return (
      <QueryErrorBanner
        onRetry={() =>
          catalogError ? window.location.reload() : void refetch()
        }
      />
    );
  if (!catalogReady) return <p role="status">Loading problem catalog…</p>;

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

  if (
    (progressLoading && !activeSession) ||
    !activeSession ||
    activeSession.problemId !== targetProblemId
  ) {
    return (
      <div className="animate-in fade-in duration-500 w-full max-w-4xl mx-auto py-8 flex items-center justify-center min-h-[40vh]">
        <div
          className="flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
          <span className="sr-only">Loading session</span>
        </div>
      </div>
    );
  }

  const isNew = !activeSession.isReview && !activeSession.isColdSolve;

  return (
    <div className="w-full animate-in">
      <Timer
        key={problem.id}
        problem={problem}
        isNew={isNew}
        isColdSolve={activeSession.isColdSolve}
        onComplete={() => {
          const destination = returnTo || "/library";
          clearSessionReturnTo();
          navigate(destination);
        }}
      />
    </div>
  );
};
