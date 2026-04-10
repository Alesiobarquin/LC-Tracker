import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useProblemProgress } from '../hooks/useUserData';
import { problemMap } from '../data/problems';
import { Timer } from './Timer';

export const TimerPage: React.FC = () => {
    const { problemId } = useParams<{ problemId: string }>();
    const activeSession = useStore(state => state.activeSession);
    const { progress } = useProblemProgress();
    const navigate = useNavigate();

    const targetProblemId = problemId || activeSession?.problemId;

    if (!targetProblemId) {
        return <Navigate to="/library" replace />;
    }

    const problem = problemMap[targetProblemId];
    if (!problem) {
        return <Navigate to="/library" replace />;
    }

    return (
        <div className="animate-in fade-in duration-500 w-full max-w-4xl mx-auto py-8">
            <Timer 
                problem={problem} 
                isNew={!progress[problem.id]} 
                isColdSolve={activeSession?.isColdSolve}
                onComplete={() => navigate('/library')} 
            />
        </div>
    );
};