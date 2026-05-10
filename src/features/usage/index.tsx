import { Loader2, Gauge, AlertCircle, CalendarDays } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUsage } from "./hooks"
import {
  LimitTypeLabels,
  isUnlimited,
  type UsageItem,
} from "./api"

function ProgressBar({
  percent,
  colorClass,
}: {
  percent: number
  colorClass: string
}) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full transition-all ${colorClass}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  )
}

function getColorClass(percent: number, unlimited: boolean): string {
  if (unlimited) return "bg-muted-foreground/30"
  if (percent >= 90) return "bg-red-500"
  if (percent >= 70) return "bg-amber-500"
  return "bg-emerald-500"
}

function UsageRow({ item }: { item: UsageItem }) {
  const unlimited = isUnlimited(item.max)
  const percent = unlimited ? 0 : item.max > 0 ? (item.current / item.max) * 100 : 0
  const colorClass = getColorClass(percent, unlimited)
  const label = LimitTypeLabels[item.limitType] ?? `Limit ${item.limitType}`

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {unlimited ? (
            <>
              <span className="font-medium text-foreground">{item.current}</span>
              <span className="mx-1">/</span>
              <span>Sınırsız</span>
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{item.current}</span>
              <span className="mx-1">/</span>
              <span>{item.max}</span>
            </>
          )}
        </span>
      </div>
      <ProgressBar percent={percent} colorClass={colorClass} />
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR")
  } catch {
    return iso
  }
}

function calcRemainingDays(endDate: string): number {
  const end = new Date(endDate).getTime()
  const now = Date.now()
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
}

export default function UsagePage() {
  const { data, isLoading, isError } = useUsage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plan Kullanımı</h1>
        <p className="text-muted-foreground">
          Aktif aboneliğinizin limitlerini ve mevcut kullanımınızı görüntüleyin
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : isError || !data ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Aktif aboneliğiniz bulunmuyor.</p>
                <p className="text-sm text-muted-foreground">
                  Plan limitlerini görüntülemek için lütfen yöneticinizle iletişime geçin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <span>{data.planName}</span>
                    {data.isDemo && (
                      <Badge variant="secondary">Demo</Badge>
                    )}
                    {data.isActive ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      >
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Pasif - Yöneticinizle iletişime geçin
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Aboneliğinizin geçerlilik bilgileri
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Başlangıç</p>
                  <p className="font-medium">{formatDate(data.startDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Bitiş</p>
                  <p className="font-medium">{formatDate(data.endDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Kalan Süre</p>
                  <p className="font-medium">
                    {(() => {
                      const remaining = calcRemainingDays(data.endDate)
                      return remaining > 0 ? `${remaining} gün kaldı` : "Süresi doldu"
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gauge className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Limit Kullanımı</CardTitle>
                  <CardDescription>
                    Plan kapsamındaki kaynak limitleriniz ve mevcut kullanımınız
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {data.items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Limit bilgisi bulunamadı.
                </p>
              ) : (
                <div className="space-y-5">
                  {data.items.map((item) => (
                    <UsageRow key={item.limitType} item={item} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
