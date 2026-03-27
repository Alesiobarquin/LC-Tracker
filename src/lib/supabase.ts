import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

/** Fetches the Clerk session token with a timeout to avoid hanging on init. */
async function getClerkToken(timeoutMs = 3000): Promise<string | null> {
  try {
    // @ts-ignore - Clerk injects itself onto the window object
    const clerk = window.Clerk;
    if (!clerk?.session) return null;

    return await Promise.race([
      clerk.session.getToken() as Promise<string | null>,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  } catch {
    return null;
  }
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  global: {
    fetch: async (url, options: RequestInit = {}) => {
      // Third-Party Auth (JWKS): use the standard Clerk JWT.
      const clerkToken = await getClerkToken();

      // Build Headers safely
      const headers = new Headers(options?.headers);
      if (clerkToken) {
        headers.set('Authorization', `Bearer ${clerkToken}`);
      }

      return fetch(url, { ...options, headers });
    },
  },
});
