import { Link } from "react-router-dom"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 text-center">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h1 className="text-2xl font-bold tracking-tight">Sayfa bulunamadı</h1>
        <p className="text-sm text-muted-foreground">
          Aradığınız sayfa taşınmış veya hiç var olmamış olabilir. Adresi kontrol edin
          ya da ana sayfaya dönün.
        </p>
        <Link
          to="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
