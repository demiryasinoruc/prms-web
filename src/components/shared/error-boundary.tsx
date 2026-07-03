import { Component, type ErrorInfo, type ReactNode } from "react"
import { isChunkLoadError, tryAutoReloadForChunkError } from "@/lib/chunk-error"

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

export function ErrorFallback({ error }: { error: unknown }) {
  const chunkError = isChunkLoadError(error)
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {chunkError ? "Uygulama güncellendi" : "Bir şeyler ters gitti"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {chunkError
            ? "Yeni bir sürüm yayınlandı. Devam etmek için sayfayı yenileyin."
            : "Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi deneyin; sorun devam ederse destek ile iletişime geçin."}
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sayfayı Yenile
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/"
            }}
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Uygulama kökü için hata sınırı: render hatasında beyaz ekran yerine
 * Türkçe bir kurtarma ekranı gösterir. Deploy sonrası chunk-load hatasında
 * bir kez otomatik yeniler.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (tryAutoReloadForChunkError(error)) return
    console.error("ErrorBoundary yakaladı:", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
