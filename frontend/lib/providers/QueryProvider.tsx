"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute - data considered fresh for 1 min
            gcTime: 5 * 60 * 1000, // 5 minutes - keep cached data in memory for 5 min
            refetchOnWindowFocus: false, // Don't refetch when user switches tabs
            refetchOnMount: true, // Refetch if data is stale
            refetchOnReconnect: true, // Refetch when reconnecting after offline
            retry: 2, // Retry failed requests twice
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
