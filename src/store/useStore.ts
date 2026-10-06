import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ActiveSession, RecallDraft } from "../types";
import { safeUUID } from "../utils/uuid";
import { timerStorage } from "../lib/safeStorage";
import { recallAttemptSchema } from "../utils/studySchemas";

interface UIState {
  sessionUserId: string | null;
  setSessionUser: (userId: string | null) => void;
  activeSession: ActiveSession | null;
  activeRecall: RecallDraft | null;
  startRecall: (problemId: string) => void;
  updateRecall: (patch: Partial<RecallDraft>) => void;
  endRecall: () => void;
  activeTab: string;
  sessionReturnTo: string | null;
  startSession: (
    problemId: string,
    isReview: boolean,
    isColdSolve?: boolean,
    startTimestamp?: number,
    returnTo?: string | null,
  ) => void;
  setSessionStartTimestamp: (startTimestamp: number) => void;
  updateActiveSession: (patch: Partial<ActiveSession>) => void;
  endSession: () => void;
  abandonSession: () => void;
  setActiveTab: (tab: string) => void;
  clearSessionReturnTo: () => void;
}

function isValidActiveSession(value: unknown): value is ActiveSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<ActiveSession>;
  return (
    typeof session.problemId === "string" &&
    typeof session.startTimestamp === "number" &&
    Number.isFinite(session.startTimestamp) &&
    typeof session.isReview === "boolean" &&
    typeof session.isColdSolve === "boolean" &&
    (session.pausedSeconds === undefined ||
      (Number.isFinite(session.pausedSeconds) && session.pausedSeconds >= 0)) &&
    (session.pausedAt === undefined ||
      session.pausedAt === null ||
      Number.isFinite(session.pausedAt)) &&
    (session.finishedElapsed === undefined ||
      (Number.isFinite(session.finishedElapsed) &&
        session.finishedElapsed >= 0)) &&
    (session.draftNotes === undefined ||
      typeof session.draftNotes === "string") &&
    (!session.completion ||
      (session.completion.timing?.id === session.id &&
        session.completion.timing.problemId === session.problemId &&
        Number.isFinite(session.completion.timing.elapsedSeconds) &&
        session.completion.timing.elapsedSeconds >= 0 &&
        session.completion.rating >= 1 &&
        session.completion.rating <= 5))
  );
}

function isValidRecallDraft(value: unknown): value is RecallDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<RecallDraft>;
  return (
    typeof draft.id === "string" &&
    typeof draft.problemId === "string" &&
    typeof draft.startedAt === "number" &&
    Number.isFinite(draft.startedAt) &&
    (draft.pausedSeconds === undefined ||
      (Number.isFinite(draft.pausedSeconds) && draft.pausedSeconds >= 0)) &&
    (draft.pausedAt === undefined ||
      draft.pausedAt === null ||
      Number.isFinite(draft.pausedAt)) &&
    typeof draft.answer === "string" &&
    (draft.retrievedAnswer === undefined ||
      typeof draft.retrievedAnswer === "string") &&
    (draft.compared === undefined || typeof draft.compared === "boolean") &&
    (draft.notes === undefined || typeof draft.notes === "string") &&
    (draft.notesLanguage === undefined ||
      ["python", "cpp"].includes(draft.notesLanguage)) &&
    typeof draft.revealed === "boolean" &&
    ["notes", "reference", "external", "solution"].includes(
      draft.checkedAgainst ?? "",
    ) &&
    (!draft.completion ||
      (recallAttemptSchema.safeParse(draft.completion.attempt).success &&
        draft.completion.attempt.id === draft.id))
  );
}

export const useStore = create<UIState>()(
  persist(
    (set, get) => ({
      sessionUserId: null,
      setSessionUser: (userId) =>
        set((state) => ({
          sessionUserId: userId,
          activeSession:
            !userId ||
            (state.activeSession?.userId &&
              state.activeSession.userId !== userId)
              ? null
              : state.activeSession
                ? { ...state.activeSession, userId }
                : null,
          activeRecall:
            !userId ||
            (state.activeRecall?.userId && state.activeRecall.userId !== userId)
              ? null
              : state.activeRecall
                ? { ...state.activeRecall, userId }
                : null,
          sessionReturnTo: !userId ? null : state.sessionReturnTo,
        })),
      activeSession: null,
      activeRecall: null,
      startRecall: (problemId) =>
        set((state) =>
          state.activeRecall || state.activeSession
            ? state
            : {
                activeRecall: {
                  id: safeUUID(),
                  userId: get().sessionUserId ?? undefined,
                  problemId,
                  startedAt: Date.now(),
                  pausedSeconds: 0,
                  pausedAt: null,
                  answer: "",
                  revealed: false,
                  checkedAgainst: "external",
                },
              },
        ),
      updateRecall: (patch) =>
        set((state) => ({
          activeRecall: state.activeRecall
            ? { ...state.activeRecall, ...patch }
            : null,
        })),
      endRecall: () => set({ activeRecall: null }),
      activeTab: "dashboard",
      sessionReturnTo: null,
      startSession: (
        problemId,
        isReview,
        isColdSolve = false,
        startTimestamp = Date.now(),
        returnTo = null,
      ) =>
        set((state) =>
          state.activeSession || state.activeRecall
            ? state
            : {
                activeSession: {
                  id: safeUUID(),
                  userId: get().sessionUserId ?? undefined,
                  problemId,
                  startTimestamp,
                  isReview,
                  isColdSolve,
                  practiceKind:
                    isReview || isColdSolve ? "coding_review" : "learning",
                  pausedSeconds: 0,
                  pausedAt: null,
                },
                sessionReturnTo: returnTo,
              },
        ),
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
      name: "lc-tracker-active-session",
      storage: createJSONStorage(() => timerStorage),
      partialize: (state) => ({
        activeSession: state.activeSession,
        activeRecall: state.activeRecall,
        sessionReturnTo: state.sessionReturnTo,
      }),
      merge: (persisted, current) => {
        const incoming = (persisted ?? {}) as Partial<UIState>;
        return {
          ...current,
          activeSession: isValidActiveSession(incoming.activeSession)
            ? {
                ...incoming.activeSession,
                id: incoming.activeSession.id || safeUUID(),
              }
            : null,
          activeRecall: isValidRecallDraft(incoming.activeRecall)
            ? {
                ...incoming.activeRecall,
                // Old revealed drafts were locked, so their answer is still unaided.
                retrievedAnswer:
                  incoming.activeRecall.retrievedAnswer ??
                  (incoming.activeRecall.revealed
                    ? incoming.activeRecall.answer
                    : undefined),
              }
            : null,
          sessionReturnTo:
            typeof incoming.sessionReturnTo === "string" ||
            incoming.sessionReturnTo === null
              ? (incoming.sessionReturnTo ?? null)
              : null,
        };
      },
    },
  ),
);
