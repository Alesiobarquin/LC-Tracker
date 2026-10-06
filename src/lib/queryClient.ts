import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import { reportOperationError } from './operationFeedback';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({ onError: (error) => reportOperationError(error, 'save') }),
  queryCache: new QueryCache({ onError: (error) => reportOperationError(error, 'load') }),
  defaultOptions: {
    mutations: { retry: false },
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
      retry: 1,
      retryDelay: 500,
      refetchOnWindowFocus: true,
      // Realtime is a freshness optimization; polling recovers missed events.
      refetchInterval: 60_000,
    },
  },
});
