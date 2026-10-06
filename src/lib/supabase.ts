import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

/** Token failures must surface as errors, never as anonymous successful reads. */
async function getClerkToken(timeoutMs = 3000): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const clerk = (window as Window & {
      Clerk?: { session?: { getToken: () => Promise<string | null> } };
    }).Clerk;
    if (!clerk?.session) return null;

    const token = await Promise.race([
      clerk.session.getToken(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Sign-in token timed out. Please retry.')), timeoutMs);
      }),
    ]);
    if (!token) throw new Error('Sign-in session expired. Please sign in again.');
    return token;
  } finally {
    clearTimeout(timer);
  }
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  // Supplies Clerk JWTs to REST, Storage, and Realtime through the SDK.
  accessToken: getClerkToken,
  global: {
    fetch: async (url, options: RequestInit = {}) => {
      const timeout = AbortSignal.timeout(15_000);
      const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
      return fetch(url, { ...options, signal });
    },
  },
});
