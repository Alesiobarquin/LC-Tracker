import { create } from 'zustand';
import type { ActiveSession } from '../types';

interface UIState {
  activeSession: ActiveSession | null;
  activeTab: string;
  startSession: (problemId: string, isReview: boolean, isColdSolve?: boolean) => void;
  endSession: () => void;
  abandonSession: () => void;
  setActiveTab: (tab: string) => void;
}

export const useStore = create<UIState>((set) => ({
  activeSession: null,
  activeTab: 'dashboard',
  startSession: (problemId, isReview, isColdSolve = false) =>
    set({
      activeSession: {
        problemId,
        startTimestamp: Date.now(),
        isReview,
        isColdSolve,
      },
    }),
  endSession: () => set({ activeSession: null }),
  abandonSession: () => set({ activeSession: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
