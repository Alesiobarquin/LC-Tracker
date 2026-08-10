import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './useStore';

describe('useStore session persistence', () => {
  beforeEach(() => {
    useStore.setState({
      activeSession: null,
      sessionReturnTo: null,
    });
  });

  it('stores active session and return path for timer restore', () => {
    useStore.getState().startSession('two-sum', true, false, 1_700_000_000_000, '/patterns/two-pointers');

    const state = useStore.getState();
    expect(state.activeSession?.problemId).toBe('two-sum');
    expect(state.activeSession?.isReview).toBe(true);
    expect(state.activeSession?.startTimestamp).toBe(1_700_000_000_000);
    expect(state.sessionReturnTo).toBe('/patterns/two-pointers');

    state.clearSessionReturnTo();
    expect(useStore.getState().sessionReturnTo).toBeNull();
  });
});
