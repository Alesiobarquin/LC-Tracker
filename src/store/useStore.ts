import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ActiveSession } from '../types';
import { safeUUID } from '../utils/uuid';
import { timerStorage } from '../lib/safeStorage';

interface UIState {
  sessionUserId: string | null;
  setSessionUser: (userId: string | null) => void;
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
    typeof session.startTimestamp === 'number' && Number.isFinite(session.startTimestamp) &&
    typeof session.isReview === 'boolean' &&
    typeof session.isColdSolve === 'boolean' &&
    (session.pausedSeconds === undefined || (Number.isFinite(session.pausedSeconds) && session.pausedSeconds >= 0)) &&
    (session.pausedAt === undefined || session.pausedAt === null || Number.isFinite(session.pausedAt)) &&
    (session.finishedElapsed === undefined || (Number.isFinite(session.finishedElapsed) && session.finishedElapsed >= 0)) &&
    (session.draftNotes === undefined || typeof session.draftNotes === 'string') &&
    (!session.completion || (session.completion.timing?.id === session.id &&
      session.completion.timing.problemId === session.problemId &&
      Number.isFinite(session.completion.timing.elapsedSeconds) && session.completion.timing.elapsedSeconds >= 0 &&
      session.completion.rating >= 1 && session.completion.rating <= 5))
  );
}

export const useStore = create<UIState>()(
  persist(
    (set, get) => ({
      sessionUserId: null,
      setSessionUser: (userId) => set((state) => ({
        sessionUserId: userId,
        activeSession: !userId || (state.activeSession?.userId && state.activeSession.userId !== userId)
          ? null : state.activeSession ? { ...state.activeSession, userId } : null,
        sessionReturnTo: !userId ? null : state.sessionReturnTo,
      })),
      activeSession: null,
      activeTab: 'dashboard',
      sessionReturnTo: null,
      startSession: (problemId, isReview, isColdSolve = false, startTimestamp = Date.now(), returnTo = null) =>
        set({
          activeSession: {
            id: safeUUID(),
            userId: get().sessionUserId ?? undefined,
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
      storage: createJSONStorage(() => timerStorage),
      partialize: (state) => ({
        activeSession: state.activeSession,
        sessionReturnTo: state.sessionReturnTo,
      }),
      merge: (persisted, current) => {
        const incoming = (persisted ?? {}) as Partial<UIState>;
        return {
          ...current,
          activeSession: isValidActiveSession(incoming.activeSession)
            ? { ...incoming.activeSession, id: incoming.activeSession.id || safeUUID() } : null,
          sessionReturnTo:
            typeof incoming.sessionReturnTo === 'string' || incoming.sessionReturnTo === null
              ? incoming.sessionReturnTo ?? null
              : null,
        };
      },
    }
  )
);
