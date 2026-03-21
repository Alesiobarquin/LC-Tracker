import { StateStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// Helper to get the current user ID
const getUserId = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id;
};

// A simple debounce to prevent too many DB writes
let timeoutId: NodeJS.Timeout | null = null;
const debounceSave = (userId: string, stateStr: string, delay: number) => {
  return new Promise<void>((resolve) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(async () => {
      try {
        const stateObj = JSON.parse(stateStr);
        // We use upsert to insert or update the profile state
        await supabase
          .from('user_profiles')
          .upsert({ id: userId, state: stateObj, updated_at: new Date().toISOString() });
      } catch (e) {
        console.error('Failed to sync state to Supabase:', e);
      }
      resolve();
    }, delay);
  });
};

export const supabaseStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // When Zustand tries to load state, fetch it from Supabase
    const userId = await getUserId();
    if (!userId) {
      // If not logged in, we shouldn't have any state. Wait for auth to trigger.
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('state')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching state from Supabase:', error);
      return null;
    }

    if (data?.state) {
      // Zustand persist middleware expects a JSON string
      return JSON.stringify(data.state);
    }

    return null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    const userId = await getUserId();
    if (!userId) return;

    // Debounce saves by 1 second to avoid spamming the DB on rapid UI clicks
    await debounceSave(userId, value, 1000);
  },

  removeItem: async (name: string): Promise<void> => {
    // Usually called on logout or explicit reset.
    // For now, we won't delete the user's data from the DB just because they logged out.
    // The state is scoped by user ID anyway.
  },
};
