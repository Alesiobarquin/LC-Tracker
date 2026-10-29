import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "./useStore";
import { preferenceStorage } from "../lib/safeStorage";

describe("useStore session persistence", () => {
  beforeEach(() => {
    const preferences = new Map<string, string>();
    vi.spyOn(preferenceStorage, "getItem").mockImplementation((key) => preferences.get(key) ?? null);
    vi.spyOn(preferenceStorage, "setItem").mockImplementation((key, value) => { preferences.set(key, value); });
    useStore.setState({
      activeSession: null,
      activeRecall: null,
      sessionReturnTo: null,
      sessionUserId: null,
      reviewOnlyDate: null,
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("restores today’s review choice for the same account without replacing a draft", () => {
    useStore.getState().setSessionUser("user_first");
    useStore.getState().startRecall("two-sum");
    const draft = useStore.getState().activeRecall;
    useStore.getState().setReviewOnlyDate("2026-10-28");
    const persisted = useStore.persist.getOptions().partialize!(useStore.getState());
    useStore.setState({ reviewOnlyDate: null, sessionUserId: null });
    const restored = useStore.persist.getOptions().merge!(persisted, useStore.getState());
    useStore.setState(restored);
    useStore.getState().setSessionUser("user_first");
    expect(useStore.getState().reviewOnlyDate).toBe("2026-10-28");
    expect(useStore.getState().activeRecall).toEqual(draft);
    useStore.getState().setReviewOnlyDate(null);
    expect(useStore.getState().reviewOnlyDate).toBeNull();
    expect(useStore.getState().activeRecall).toEqual(draft);
  });

  it("does not transfer a review choice to another account or legacy stored state", () => {
    useStore.getState().setSessionUser("user_first");
    useStore.getState().setReviewOnlyDate("2026-10-28");
    useStore.getState().setSessionUser("user_second");
    expect(useStore.getState().reviewOnlyDate).toBeNull();
    useStore.getState().setSessionUser("user_first");
    expect(useStore.getState().reviewOnlyDate).toBe("2026-10-28");
    useStore.getState().setSessionUser(null);
    expect(useStore.getState().reviewOnlyDate).toBeNull();
    const merge = useStore.persist.getOptions().merge!;
    expect(merge({}, useStore.getState()).reviewOnlyDate).toBeNull();
    expect(merge({ reviewOnlyDate: { date: "2026-10-28" } }, useStore.getState()).reviewOnlyDate).toBeNull();
  });

  it("clears sessions when the signed-in account changes", () => {
    useStore.getState().setSessionUser("user_first");
    useStore.getState().startSession("two-sum", false);
    expect(useStore.getState().activeSession?.userId).toBe("user_first");
    useStore.getState().setSessionUser("user_second");
    expect(useStore.getState().activeSession).toBeNull();
  });

  it("retains the same ID when completion data is prepared", () => {
    useStore.getState().startSession("two-sum", false);
    const session = useStore.getState().activeSession!;
    useStore.getState().updateActiveSession({
      completion: {
        rating: 3,
        notes: "Keep me",
        timing: {
          id: session.id,
          problemId: "two-sum",
          category: "Arrays & Hashing",
          date: new Date().toISOString(),
          elapsedSeconds: 30,
          sessionType: "new",
          rating: 3,
        },
      },
    });
    expect(useStore.getState().activeSession?.completion?.timing.id).toBe(
      session.id,
    );
  });
  it("keeps a recall draft and prevents another session from replacing it", () => {
    useStore.getState().setSessionUser("user_first");
    useStore.getState().startRecall("two-sum");
    const id = useStore.getState().activeRecall!.id;
    useStore.getState().updateRecall({ answer: "Preserve this attempt" });
    useStore.getState().startSession("valid-anagram", false);
    useStore.getState().startRecall("valid-anagram");
    expect(useStore.getState().activeSession).toBeNull();
    expect(useStore.getState().activeRecall?.id).toBe(id);
    expect(useStore.getState().activeRecall?.answer).toBe(
      "Preserve this attempt",
    );
    useStore.getState().setSessionUser("user_second");
    expect(useStore.getState().activeRecall).toBeNull();
  });
  it("keeps the original coding operation when another problem is opened", () => {
    useStore.getState().startSession("two-sum", false);
    const id = useStore.getState().activeSession!.id;
    useStore.getState().startSession("valid-anagram", false);
    useStore.getState().startRecall("valid-anagram");
    expect(useStore.getState().activeSession?.id).toBe(id);
    expect(useStore.getState().activeRecall).toBeNull();
  });

  it("stores active session and return path for timer restore", () => {
    useStore
      .getState()
      .startSession(
        "two-sum",
        true,
        false,
        1_700_000_000_000,
        "/patterns/two-pointers",
      );

    const state = useStore.getState();
    expect(state.activeSession?.problemId).toBe("two-sum");
    expect(state.activeSession?.isReview).toBe(true);
    expect(state.activeSession?.startTimestamp).toBe(1_700_000_000_000);
    expect(state.sessionReturnTo).toBe("/patterns/two-pointers");

    state.clearSessionReturnTo();
    expect(useStore.getState().sessionReturnTo).toBeNull();
  });

  it("restores unfinished time edits without discarding the session", () => {
    const merge = useStore.persist.getOptions().merge!;
    useStore.getState().startSession("two-sum", true);
    useStore.getState().updateActiveSession({ timeSpentDraft: { minutes: "", seconds: "30" } });
    const coding = useStore.getState().activeSession!;
    expect(merge({ activeSession: coding }, useStore.getState()).activeSession).toEqual(coding);
    useStore.getState().endSession();
    useStore.getState().startRecall("two-sum");
    useStore.getState().updateRecall({ timeSpentDraft: { minutes: "2", seconds: "" } });
    const recall = useStore.getState().activeRecall!;
    expect(merge({ activeRecall: recall }, useStore.getState()).activeRecall).toEqual(recall);
  });
});
