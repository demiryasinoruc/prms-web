import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  Users,
  ClipboardList,
  Warehouse,
  Wrench,
  Calendar,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { DonutChart } from "@/components/shared/donut-chart"
import { RentalTrendChart } from "./rental-trend-chart"
import {
  useDashboardStats,
  useRecentRentals,
  useUpcomingReturns,
  useRentalTrend,
} from "./hooks"

const RentalStatusLabels: Record<number, string> = {
  1: "Taslak",
  2: "Rezervasyon",
  3: "Aktif",
  4: "Kısmi Teslim",
  5: "Beklemede",
  6: "Tamamlandı",
  7: "İptal",
}

function getUpcomingDateClass(plannedEndDate: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(plannedEndDate)
  end.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return "text-destructive font-medium"
  if (diffDays === 1) return "text-amber-600 font-medium"
  return "text-muted-foreground"
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const { data: recentRentals, isLoading: recentRentalsLoading } = useRecentRentals()
  const { data: upcomingReturns, isLoading: upcomingReturnsLoading } = useUpcomingReturns()
  const { data: rentalTrend, isLoading: rentalTrendLoading } = useRentalTrend()

  const statCards = [
    {
      title: "Aktif Kiralama",
      value: stats?.activeRentalsCount ?? 0,
      description: "Devam eden kiralamalar",
      icon: ClipboardList,
    },
    {
      title: "Toplam Ürün",
      value: stats?.totalProductsCount ?? 0,
      description: "Katalogdaki ürünler",
      icon: Package,
    },
    {
      title: "Müşteriler",
      value: stats?.activeCustomersCount ?? 0,
      description: "Aktif müşteri",
      icon: Users,
    },
    {
      title: "Envanter",
      value: stats?.availableInventoryCount ?? 0,
      description: `${stats?.totalInventoryCount ?? 0} toplam envanterden`,
      icon: Warehouse,
      subValue: stats?.totalInventoryCount
        ? `${Math.round((stats.availableInventoryCount / stats.totalInventoryCount) * 100)}% müsait`
        : undefined,
      ratio: stats?.totalInventoryCount
        ? stats.availableInventoryCount / stats.totalInventoryCount
        : undefined,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Kiralama işletmenizin genel görünümü
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {stat.description}
                {stat.subValue && (
                  <span className="ml-1 font-medium text-primary">{stat.subValue}</span>
                )}
              </p>
              {!isLoading && stat.ratio !== undefined && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.round(stat.ratio * 100)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bakım İstatistikleri */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bakım Planları</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {stats?.activeMaintenanceSchedulesCount ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Aktif bakım planı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Planlanmış</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {stats?.scheduledMaintenanceCount ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Bekleyen bakım</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold tabular-nums text-blue-600">
                {stats?.inProgressMaintenanceCount ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Şu an bakımda</p>
          </CardContent>
        </Card>

        <Card className={stats?.overdueMaintenanceCount ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gecikmiş</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats?.overdueMaintenanceCount ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className={`text-2xl font-bold tabular-nums ${stats?.overdueMaintenanceCount ? "text-destructive" : ""}`}>
                {stats?.overdueMaintenanceCount ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Tarihi geçmiş bakım</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kiralama Trendi</CardTitle>
          <CardDescription>Son 14 günde oluşturulan kiralamalar</CardDescription>
        </CardHeader>
        <CardContent>
          {rentalTrendLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : rentalTrend && rentalTrend.length > 0 ? (
            <RentalTrendChart data={rentalTrend} />
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              Trend verisi yok
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Son Kiralamalar</CardTitle>
              <CardDescription>
                Son 7 gündeki kiralama işlemleri
              </CardDescription>
            </div>
            <Link
              to="/rentals"
              className="text-sm text-primary hover:underline"
            >
              Tümünü Gör
            </Link>
          </CardHeader>
          <CardContent>
            {recentRentalsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !recentRentals || recentRentals.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Henüz kiralama yok
              </div>
            ) : (
              <div className="space-y-0">
                {recentRentals.map((rental) => (
                  <Link
                    key={rental.id}
                    to="/rentals"
                    className="flex items-center justify-between border-b py-2 last:border-b-0 hover:bg-muted/50 -mx-2 px-2 rounded-sm transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">{rental.rentalNumber}</div>
                      <div className="text-xs text-muted-foreground">{rental.customerName}</div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="text-xs text-muted-foreground">
                        {new Date(rental.createdDate).toLocaleDateString("tr-TR")}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {RentalStatusLabels[rental.status] ?? "Bilinmiyor"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Yaklaşan Teslimler</CardTitle>
              <CardDescription>
                Önümüzdeki 7 gündeki iadeler
              </CardDescription>
            </div>
            <Link
              to="/rentals"
              className="text-sm text-primary hover:underline"
            >
              Tümünü Gör
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingReturnsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !upcomingReturns || upcomingReturns.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Henüz yaklaşan teslim yok
              </div>
            ) : (
              <div className="space-y-0">
                {upcomingReturns.map((rental) => (
                  <Link
                    key={rental.id}
                    to="/rentals"
                    className="flex items-center justify-between border-b py-2 last:border-b-0 hover:bg-muted/50 -mx-2 px-2 rounded-sm transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">{rental.rentalNumber}</div>
                      <div className="text-xs text-muted-foreground">{rental.customerName}</div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className={`text-xs ${getUpcomingDateClass(rental.plannedEndDate)}`}>
                        {new Date(rental.plannedEndDate).toLocaleDateString("tr-TR")}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {RentalStatusLabels[rental.status] ?? "Bilinmiyor"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bakım Özeti */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bakım Durumu</CardTitle>
              <CardDescription>Genel bakım özeti</CardDescription>
            </div>
            <Link
              to="/operations/maintenance-records"
              className="text-sm text-primary hover:underline"
            >
              Tümünü Gör
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <DonutChart
                  segments={[
                    { value: stats?.scheduledMaintenanceCount ?? 0, color: "#f59e0b", label: "Planlanmış" },
                    { value: stats?.inProgressMaintenanceCount ?? 0, color: "oklch(var(--primary))", label: "Devam Eden" },
                    { value: stats?.overdueMaintenanceCount ?? 0, color: "oklch(var(--destructive))", label: "Gecikmiş" },
                  ]}
                  centerLabel="bakım"
                />
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                      <span className="text-sm">Planlanmış Bakımlar</span>
                    </div>
                    <Badge variant="secondary" className="tabular-nums">
                      {stats?.scheduledMaintenanceCount ?? 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">Devam Eden Bakımlar</span>
                    </div>
                    <Badge variant="secondary" className="tabular-nums">
                      {stats?.inProgressMaintenanceCount ?? 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-sm">Gecikmiş Bakımlar</span>
                    </div>
                    <Badge variant={stats?.overdueMaintenanceCount ? "destructive" : "secondary"} className="tabular-nums">
                      {stats?.overdueMaintenanceCount ?? 0}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bakım Planları</CardTitle>
              <CardDescription>Tanımlı bakım şablonları</CardDescription>
            </div>
            <Link
              to="/operations/maintenance-schedules"
              className="text-sm text-primary hover:underline"
            >
              Planları Yönet
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Aktif Bakım Planları</span>
                  </div>
                  <Badge variant="outline">
                    {stats?.activeMaintenanceSchedulesCount ?? 0}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bakım planları, ürün veya kategorileriniz için periyodik bakım şablonları tanımlamanızı sağlar.
                </p>
                <Link
                  to="/operations/maintenance-schedules"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <Wrench className="mr-1 h-3 w-3" />
                  Yeni Plan Oluştur
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
