import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useProblemProgress } from '../hooks/useUserData';
import { problemMap } from '../data/problems';
import { Timer } from './Timer';

export const TimerPage: React.FC = () => {
    const { problemId } = useParams<{ problemId: string }>();
    const activeSession = useStore(state => state.activeSession);
    const { progress, isLoading: progressLoading } = useProblemProgress();
    const navigate = useNavigate();

    const targetProblemId = problemId || activeSession?.problemId;

    if (!targetProblemId) {
        return <Navigate to="/library" replace />;
    }

    const problem = problemMap[targetProblemId];
    if (!problem) {
        return <Navigate to="/library" replace />;
    }

    // Wait for progress so we don't mis-tag a solved problem as "new"
    // when the user lands here before the progress query resolves.
    if (progressLoading && !activeSession) {
        return (
            <div className="animate-in fade-in duration-500 w-full max-w-4xl mx-auto py-8 flex items-center justify-center min-h-[40vh]">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                </div>
            </div>
        );
    }

    const isNew = activeSession
        ? !activeSession.isReview && !activeSession.isColdSolve
        : !progress[problem.id];

    return (
        <div className="animate-in fade-in duration-500 w-full max-w-4xl mx-auto py-8">
            <Timer 
                problem={problem} 
                isNew={isNew}
                isColdSolve={activeSession?.isColdSolve}
                onComplete={() => navigate('/library')} 
            />
        </div>
    );
};
