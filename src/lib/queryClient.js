import { QueryClient } from '@tanstack/react-query';

// Conservative defaults for a data-entry app: no surprise refetches while a person is typing.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
