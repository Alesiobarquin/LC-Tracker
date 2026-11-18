import { createClient } from '@supabase/supabase-js';
import { getClerkToken } from './clerkToken';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
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
