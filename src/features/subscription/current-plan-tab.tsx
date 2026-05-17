import { Link } from "react-router-dom"
import { ArrowUpRight, CalendarClock, AlertTriangle, Loader2, BadgeCheck, XOctagon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useCancelSubscription, useMySubscription } from "./hooks"
import { toast } from "sonner"

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function CurrentPlanTab() {
  const { data: subscription, isLoading } = useMySubscription()
  const cancelMutation = useCancelSubscription()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Aktif aboneliğiniz bulunmuyor.</p>
            <p className="text-sm text-muted-foreground">
              Bir plan seçerek hemen kullanmaya başlayın.
            </p>
          </div>
          <Button asChild>
            <Link to="/settings/subscription/upgrade">
              Plan seç
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isCancelled = !!subscription.cancelledDate
  const inGracePeriod = !!subscription.gracePeriodEnd

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{subscription.planName}</CardTitle>
                  {subscription.isDemo && <Badge variant="secondary">Demo</Badge>}
                  {isCancelled && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">
                      Yenileme iptal edildi
                    </Badge>
                  )}
                  {inGracePeriod && (
                    <Badge variant="destructive">Ödeme bekliyor</Badge>
                  )}
                </div>
                <CardDescription>
                  {subscription.billingCycle === "Yearly" ? "Yıllık" : "Aylık"} faturalama ·{" "}
                  {formatAmount(subscription.amount, subscription.currency)}
                  {subscription.billingCycle === "Yearly" ? "/yıl" : "/ay"}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {!isCancelled && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">
                        <XOctagon className="mr-1 h-4 w-4" />
                        Aboneliği iptal et
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Aboneliği iptal et?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {formatDate(subscription.endDate)} tarihine kadar tüm Pro
                          özelliklerini kullanmaya devam edersiniz. Bu tarihten sonra
                          plan yenilenmez ve aboneliğiniz sona erer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            await cancelMutation.mutateAsync()
                            toast.success("Abonelik iptal edildi. Bitiş tarihine kadar kullanmaya devam edebilirsiniz.")
                          }}
                        >
                          Onaylıyorum, iptal et
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button asChild>
                  <Link to="/settings/subscription/upgrade">
                    Plan değiştir
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <DetailItem
                icon={<CalendarClock className="h-4 w-4" />}
                label="Başlangıç"
                value={formatDate(subscription.startDate)}
              />
              <DetailItem
                icon={<CalendarClock className="h-4 w-4" />}
                label={isCancelled ? "Bitiş" : "Sonraki ödeme"}
                value={formatDate(isCancelled ? subscription.endDate : subscription.nextBillingDate)}
              />
              <DetailItem
                icon={<BadgeCheck className="h-4 w-4" />}
                label="Otomatik yenileme"
                value={subscription.autoRenew && !isCancelled ? "Açık" : "Kapalı"}
                tone={subscription.autoRenew && !isCancelled ? "positive" : "muted"}
              />
            </div>

            {inGracePeriod && (
              <>
                <Separator className="my-6" />
                <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div className="text-sm">
                    <p className="font-medium text-red-700 dark:text-red-400">
                      Son ödeme alınamadı.
                    </p>
                    <p className="text-muted-foreground">
                      {formatDate(subscription.gracePeriodEnd)} tarihine kadar
                      ödemeniz tahsil edilmezse hizmetiniz askıya alınır. Lütfen kart
                      bilginizi gözden geçirin.
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

interface DetailItemProps {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "positive" | "muted"
}

function DetailItem({ icon, label, value, tone }: DetailItemProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={
          tone === "positive"
            ? "text-base font-semibold text-emerald-600 dark:text-emerald-400"
            : tone === "muted"
              ? "text-base font-semibold text-muted-foreground"
              : "text-base font-semibold"
        }
      >
        {value}
      </div>
    </div>
  )
}
