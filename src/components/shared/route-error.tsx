import { useEffect } from "react"
import { useRouteError } from "react-router-dom"
import { ErrorFallback } from "./error-boundary"
import { tryAutoReloadForChunkError } from "@/lib/chunk-error"

/**
 * Router seviyesindeki hatalar (lazy chunk yüklenemedi, render hatası) için
 * errorElement. Deploy sonrası chunk hatasında bir kez otomatik yeniler.
 */
export function RouteError() {
  const error = useRouteError()

  useEffect(() => {
    if (!tryAutoReloadForChunkError(error)) {
      console.error("Route hatası:", error)
    }
  }, [error])

  return <ErrorFallback error={error} />
}
