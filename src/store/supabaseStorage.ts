import { StateStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// ─── Cloud Sync Gate ──────────────────────────────────────────────────────────
// writeEnabled is false at startup. This prevents setItem from pushing data to
// Supabase before auth has been confirmed and the cloud state has been merged.
// AuthProvider calls enableCloudSync() after the full hydration sequence.
let writeEnabled = false;

export const enableCloudSync = () => {
  writeEnabled = true;
  console.log('[HybridStorage] Cloud sync enabled');
};

export const disableCloudSync = () => {
  writeEnabled = false;
  console.log('[HybridStorage] Cloud sync disabled');
};

// ─── Debounce for DB Writes ───────────────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const pushStateToCloudDebounced = (userId: string, stateStr: string, delay = 1000) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const stateObj = JSON.parse(stateStr);
      await supabase
        .from('user_profiles')
        .upsert({ id: userId, state: stateObj, updated_at: new Date().toISOString() });
      console.log('[HybridStorage] State pushed to cloud for user', userId);
    } catch (e) {
      console.error('[HybridStorage] Failed to push state to Supabase:', e);
    }
  }, delay);
};

// ─── Public: Fetch Cloud State ────────────────────────────────────────────────
// Called by AuthProvider after auth is confirmed. Returns the raw state object
// from the DB, or null if there is no cloud record yet.
export const fetchCloudState = async (userId: string): Promise<object | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('state')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found; all other errors are real problems
      console.error('[HybridStorage] Error fetching cloud state:', error);
      return null;
    }

    if (data?.state) {
      console.log('[HybridStorage] Cloud state fetched for user', userId);
      return data.state as object;
    }
  } catch (e) {
    console.error('[HybridStorage] Exception fetching cloud state:', e);
  }
  return null;
};

// ─── Public: Force-push current localStorage to cloud ─────────────────────────
// Used by AuthProvider after merge to ensure Supabase reflects merged truth.
export const pushStateToCloud = async (userId: string, stateStr: string): Promise<void> => {
  try {
    const stateObj = JSON.parse(stateStr);
    await supabase
      .from('user_profiles')
      .upsert({ id: userId, state: stateObj, updated_at: new Date().toISOString() });
    console.log('[HybridStorage] Initial merged state pushed to cloud for user', userId);
  } catch (e) {
    console.error('[HybridStorage] Failed to push merged state to Supabase:', e);
  }
};

// ─── Zustand StateStorage Adapter ─────────────────────────────────────────────
export const supabaseStorage: StateStorage = {
  // getItem: Reads ONLY from localStorage. Supabase fetching is handled
  // explicitly by AuthProvider to avoid the async race condition.
  getItem: (name: string): string | null => {
    const localData = window.localStorage.getItem(name);
    console.log('[HybridStorage] Local hydration complete, onStorage key:', name);
    return localData;
  },

  // setItem: Always writes to localStorage. Only syncs to Supabase if
  // writeEnabled is true (set after auth + cloud merge are complete).
  setItem: async (name: string, value: string): Promise<void> => {
    window.localStorage.setItem(name, value);

    if (!writeEnabled) return;

    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) return;

    pushStateToCloudDebounced(userId, value, 1000);
  },

  // removeItem: Actually clears localStorage (was a no-op before).
  // Called when the user signs out.
  removeItem: (name: string): void => {
    window.localStorage.removeItem(name);
    console.log('[HybridStorage] Local storage cleared for key:', name);
  },
};
