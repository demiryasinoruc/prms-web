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
import { useDashboardStats } from "./hooks"

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()

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
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {stat.description}
                {stat.subValue && (
                  <span className="ml-1 text-green-600">{stat.subValue}</span>
                )}
              </p>
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
              <div className="text-2xl font-bold">
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
              <div className="text-2xl font-bold">
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
              <div className="text-2xl font-bold text-blue-600">
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
              <div className={`text-2xl font-bold ${stats?.overdueMaintenanceCount ? "text-destructive" : ""}`}>
                {stats?.overdueMaintenanceCount ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Tarihi geçmiş bakım</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Son Kiralamalar</CardTitle>
            <CardDescription>
              Son 7 gündeki kiralama işlemleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Henüz veri yok
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Teslimler</CardTitle>
            <CardDescription>
              Önümüzdeki 7 gündeki iadeler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Henüz veri yok
            </div>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-sm">Planlanmış Bakımlar</span>
                  </div>
                  <Badge variant="secondary">
                    {stats?.scheduledMaintenanceCount ?? 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-sm">Devam Eden Bakımlar</span>
                  </div>
                  <Badge variant="secondary">
                    {stats?.inProgressMaintenanceCount ?? 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-sm">Gecikmiş Bakımlar</span>
                  </div>
                  <Badge variant={stats?.overdueMaintenanceCount ? "destructive" : "secondary"}>
                    {stats?.overdueMaintenanceCount ?? 0}
                  </Badge>
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
