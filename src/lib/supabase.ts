import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  global: {
    fetch: async (url, options: RequestInit = {}) => {
      // @ts-ignore - Clerk injects itself onto the window object
      // Third-Party Auth (JWKS): use the standard Clerk JWT — no template needed.
      const clerkToken = await window.Clerk?.session?.getToken();

      // Build Headers safely
      const headers = new Headers(options?.headers);
      if (clerkToken) {
        headers.set('Authorization', `Bearer ${clerkToken}`);
      }

      return fetch(url, { ...options, headers });
    },
  },
});
