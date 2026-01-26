import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error) => {
        // 4xx hataları için retry yapma (client error - tekrar denemek anlamsız)
        if (error && typeof error === "object" && "response" in error) {
          const status = (error as { response?: { status?: number } }).response?.status
          if (status && status >= 400 && status < 500) {
            return false
          }
        }
        // Diğer hatalar için en fazla 1 retry
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
  },
})
