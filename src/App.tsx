import { RouterProvider } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { router } from "@/router"
import { queryClient } from "@/lib/query-client"
import { useEffect } from "react"
import { initializeTheme } from "@/stores/theme"
import { ConfirmProvider } from "@/components/shared/confirm-provider"
import { ErrorBoundary } from "@/components/shared/error-boundary"

function App() {
  useEffect(() => {
    initializeTheme()
  }, [])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-right" closeButton richColors />
        <ConfirmProvider />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
