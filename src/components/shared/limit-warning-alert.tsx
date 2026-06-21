import { Link } from "react-router-dom"
import { AlertTriangle, ArrowUpRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useSubscriptionUsage } from "@/features/usage/hooks"
import { LimitTypeLabels, type LimitType } from "@/features/usage/api"

interface LimitWarningAlertProps {
  limitType: LimitType
  className?: string
}

/**
 * İlgili kaynağın abonelik limiti dolduğunda kullanıcıyı uyarır ve Pro pakete
 * yükseltmeye yönlendirir. Limit dolmadıysa, sınırsızsa ya da veri henüz
 * yüklenmediyse hiçbir şey render etmez.
 */
export function LimitWarningAlert({ limitType, className }: LimitWarningAlertProps) {
  const { byType, isLoading, isError } = useSubscriptionUsage()

  // Veri henüz gelmemişken (loading) ya da hata varken uyarı gösterme.
  if (isLoading || isError) return null

  const entry = byType(limitType)
  if (!entry) return null

  // Sınırsız plan ya da limit dolmamışsa uyarı gösterme.
  if (entry.isUnlimited || entry.current < entry.max) return null

  const label = LimitTypeLabels[limitType] ?? limitType

  return (
    <Alert variant="warning" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{label} limitiniz dolu</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Mevcut planınızda {entry.max} {label} hakkınız var ({entry.current}/
          {entry.max} kullanıldı). Daha fazlası için Pro pakete yükseltin.
        </p>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="border-amber-400 bg-white/60 text-amber-900 hover:bg-white dark:bg-transparent dark:text-amber-200"
        >
          <Link to="/settings/subscription">
            Paketi Yükselt
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
