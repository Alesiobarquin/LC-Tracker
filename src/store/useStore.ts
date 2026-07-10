import { create } from 'zustand';
import type { ActiveSession } from '../types';

interface UIState {
  activeSession: ActiveSession | null;
  activeTab: string;
  startSession: (problemId: string, isReview: boolean, isColdSolve?: boolean, startTimestamp?: number) => void;
  setSessionStartTimestamp: (startTimestamp: number) => void;
  updateActiveSession: (patch: Partial<ActiveSession>) => void;
  endSession: () => void;
  abandonSession: () => void;
  setActiveTab: (tab: string) => void;
}

export const useStore = create<UIState>((set) => ({
  activeSession: null,
  activeTab: 'dashboard',
  startSession: (problemId, isReview, isColdSolve = false, startTimestamp = Date.now()) =>
    set({
      activeSession: {
        problemId,
        startTimestamp,
        isReview,
        isColdSolve,
        pausedSeconds: 0,
        pausedAt: null,
      },
    }),
  setSessionStartTimestamp: (startTimestamp) =>
    set((state) => {
      if (!state.activeSession) return state;
      return {
        activeSession: {
          ...state.activeSession,
          startTimestamp,
        },
      };
    }),
  updateActiveSession: (patch) =>
    set((state) => {
      if (!state.activeSession) return state;
      return {
        activeSession: {
          ...state.activeSession,
          ...patch,
        },
      };
    }),
  endSession: () => set({ activeSession: null }),
  abandonSession: () => set({ activeSession: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
