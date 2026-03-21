import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { userDataQueryKeys } from '../lib/userDataQueryKeys';

/**
 * Subscribes to Supabase Realtime for normalized user tables.
 * Enable replication for these tables in Supabase: Database → Replication.
 */
export function useRealtimeSync(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-data-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'problem_progress', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: userDataQueryKeys.progress(userId) })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: userDataQueryKeys.settings(userId) })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_log', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: userDataQueryKeys.activity(userId) })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_timings', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: userDataQueryKeys.timings(userId) })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sprint_state', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: userDataQueryKeys.sprint(userId) })
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);
}
