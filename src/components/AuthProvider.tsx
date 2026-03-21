import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import {
  enableCloudSync,
  disableCloudSync,
  fetchCloudState,
  pushStateToCloud,
} from '../store/supabaseStorage';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  hydrated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Deep merge helper ─────────────────────────────────────────────────────────
// Merges cloudState into localState. Cloud wins on scalar/array fields,
// but for the progress map we union (taking the entry with more history).
function mergeStates(
  localState: Record<string, unknown>,
  cloudState: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...localState };

  for (const key of Object.keys(cloudState)) {
    const cloudVal = cloudState[key];
    const localVal = localState[key];

    if (key === 'progress') {
      // Union problem progress: take whichever entry has the longer history
      const localProgress = (localVal ?? {}) as Record<string, { history: unknown[] }>;
      const cloudProgress = (cloudVal ?? {}) as Record<string, { history: unknown[] }>;
      const unioned: Record<string, unknown> = { ...localProgress };
      for (const pid of Object.keys(cloudProgress)) {
        const localEntry = localProgress[pid];
        const cloudEntry = cloudProgress[pid];
        if (!localEntry || (cloudEntry.history?.length ?? 0) >= (localEntry.history?.length ?? 0)) {
          unioned[pid] = cloudEntry;
        }
      }
      merged['progress'] = unioned;
    } else if (
      cloudVal !== null &&
      typeof cloudVal === 'object' &&
      !Array.isArray(cloudVal) &&
      localVal !== null &&
      typeof localVal === 'object' &&
      !Array.isArray(localVal)
    ) {
      // Recursively deep-merge plain objects (settings, streak, etc.)
      merged[key] = mergeStates(
        localVal as Record<string, unknown>,
        cloudVal as Record<string, unknown>
      );
    } else {
      // For scalars and arrays, cloud wins (it is the source of truth)
      merged[key] = cloudVal;
    }
  }

  return merged;
}

// ─── Timeout helper ──────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => {
      console.warn(`[AuthProvider] Cloud operation timed out after ${ms}ms, proceeding with local data`);
      resolve(fallback);
    }, ms)),
  ]);
}

// ─── Hydration orchestration ───────────────────────────────────────────────────
async function orchestrateHydration(userId: string, storageKey: string) {
  // Phase 1: Hydrate from localStorage immediately (sync read, no flicker)
  // The store has skipHydration:true, so we do it manually here.
  await useStore.persist.rehydrate();
  console.log('[AuthProvider] Phase 1: Local hydration complete');

  // Phase 2: Fetch cloud state and merge (with 5s timeout to prevent hanging)
  const cloudState = await withTimeout(fetchCloudState(userId), 5000, null);
  if (cloudState) {
    const localRaw = window.localStorage.getItem(storageKey);
    let localState: Record<string, unknown> = {};
    if (localRaw) {
      try {
        // Zustand wraps the state in { state: {...}, version: N }
        const parsed = JSON.parse(localRaw);
        localState = (parsed?.state ?? parsed) as Record<string, unknown>;
      } catch {
        // ignore parse errors
      }
    }

    const cloudStateObj = cloudState as Record<string, unknown>;
    const merged = mergeStates(localState, cloudStateObj);

    // Apply merged state to the store
    useStore.setState(merged as unknown as Parameters<typeof useStore.setState>[0]);

    // Persist merged result to localStorage so future page loads are fast
    const stateToStore = JSON.stringify({ state: merged, version: 0 });
    window.localStorage.setItem(storageKey, stateToStore);

    console.log('[AuthProvider] Phase 2: Cloud state merged');
  } else {
    console.log('[AuthProvider] Phase 2: No cloud state found, keeping local data');
  }

  // Phase 3: Enable cloud sync. Push merged state in background (non-blocking).
  enableCloudSync();
  const finalState = window.localStorage.getItem(storageKey);
  if (finalState) {
    // Fire-and-forget — don't block the UI on the initial cloud push
    try {
      const parsed = JSON.parse(finalState);
      const innerState = parsed?.state ?? parsed;
      pushStateToCloud(userId, JSON.stringify(innerState)).catch((err) =>
        console.warn('[AuthProvider] Background cloud push failed:', err)
      );
    } catch {
      // ignore — local-only for now
    }
  }
  console.log('[AuthProvider] Phase 3: Cloud sync enabled');
}

// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'leetcode-tracker-storage';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      try {
        if (session?.user) {
          await orchestrateHydration(session.user.id, STORAGE_KEY);
        } else {
          // Not logged in — still hydrate from localStorage so the Login page
          // can render immediately, but do NOT enable cloud sync.
          await useStore.persist.rehydrate();
          console.log('[AuthProvider] No session, local-only hydration');
        }
      } catch (err) {
        console.error('[AuthProvider] Hydration error (non-fatal, proceeding):', err);
      } finally {
        if (isMounted) {
          setHydrated(true);
          setLoading(false);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      try {
        if (session?.user) {
          // Re-run the full hydration sequence on sign-in (e.g., after OAuth redirect)
          setHydrated(false);
          await orchestrateHydration(session.user.id, STORAGE_KEY);
        } else {
          // Sign-out: disable cloud sync, clear local state
          disableCloudSync();
          window.localStorage.removeItem(STORAGE_KEY);
          useStore.getState().resetProgress();
        }
      } catch (err) {
        console.error('[AuthProvider] Auth state change error (non-fatal):', err);
      } finally {
        if (isMounted) {
          setHydrated(true);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, hydrated, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
