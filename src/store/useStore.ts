import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ActiveSession } from '../types';

interface UIState {
  activeSession: ActiveSession | null;
  activeTab: string;
  sessionReturnTo: string | null;
  startSession: (
    problemId: string,
    isReview: boolean,
    isColdSolve?: boolean,
    startTimestamp?: number,
    returnTo?: string | null
  ) => void;
  setSessionStartTimestamp: (startTimestamp: number) => void;
  updateActiveSession: (patch: Partial<ActiveSession>) => void;
  endSession: () => void;
  abandonSession: () => void;
  setActiveTab: (tab: string) => void;
  clearSessionReturnTo: () => void;
}

function isValidActiveSession(value: unknown): value is ActiveSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<ActiveSession>;
  return (
    typeof session.problemId === 'string' &&
    typeof session.startTimestamp === 'number' &&
    typeof session.isReview === 'boolean' &&
    typeof session.isColdSolve === 'boolean' &&
    (session.pausedSeconds === undefined || typeof session.pausedSeconds === 'number') &&
    (session.pausedAt === undefined || session.pausedAt === null || typeof session.pausedAt === 'number')
  );
}

export const useStore = create<UIState>()(
  persist(
    (set) => ({
      activeSession: null,
      activeTab: 'dashboard',
      sessionReturnTo: null,
      startSession: (problemId, isReview, isColdSolve = false, startTimestamp = Date.now(), returnTo = null) =>
        set({
          activeSession: {
            problemId,
            startTimestamp,
            isReview,
            isColdSolve,
            pausedSeconds: 0,
            pausedAt: null,
          },
          sessionReturnTo: returnTo,
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
      abandonSession: () => set({ activeSession: null, sessionReturnTo: null }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      clearSessionReturnTo: () => set({ sessionReturnTo: null }),
    }),
    {
      name: 'lc-tracker-active-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeSession: state.activeSession,
        sessionReturnTo: state.sessionReturnTo,
      }),
      merge: (persisted, current) => {
        const incoming = (persisted ?? {}) as Partial<UIState>;
        return {
          ...current,
          ...incoming,
          activeSession: isValidActiveSession(incoming.activeSession) ? incoming.activeSession : null,
          sessionReturnTo:
            typeof incoming.sessionReturnTo === 'string' || incoming.sessionReturnTo === null
              ? incoming.sessionReturnTo ?? null
              : null,
        };
      },
    }
  )
);
