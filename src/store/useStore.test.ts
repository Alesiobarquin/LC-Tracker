import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./useStore";

describe("useStore session persistence", () => {
  beforeEach(() => {
    useStore.setState({
      activeSession: null,
      activeRecall: null,
      sessionReturnTo: null,
    });
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
});
