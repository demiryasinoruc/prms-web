import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useDeleteNotification,
} from "./hooks"
import {
  NotificationStatus,
  NotificationType,
  NotificationTypeLabels,
  type NotificationListItem,
} from "./api"

const statusFilters = [
  { value: "all", label: "Tümü" },
  { value: "unread", label: "Okunmamış" },
] as const

type StatusFilter = (typeof statusFilters)[number]["value"]

const PAGE_SIZE = 100

export default function NotificationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [limit, setLimit] = useState(PAGE_SIZE)

  const params = {
    onlyUnread: statusFilter === "unread" ? true : undefined,
    type: typeFilter !== "all" ? (Number(typeFilter) as NotificationType) : undefined,
    limit,
  }
  const { data: notifications, isLoading } = useNotifications(params)
  const markAll = useMarkAllNotificationsRead()
  const markOne = useMarkNotificationRead()
  const deleteOne = useDeleteNotification()

  const formatRelative = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const minutes = Math.round(diffMs / 60000)
    if (minutes < 1) return "az önce"
    if (minutes < 60) return `${minutes} dk önce`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours} saat önce`
    const days = Math.round(hours / 24)
    if (days < 30) return `${days} gün önce`
    return new Date(iso).toLocaleDateString("tr-TR")
  }

  const renderItem = (n: NotificationListItem) => {
    const isUnread = n.status === NotificationStatus.Unread
    return (
      <div
        key={n.id}
        className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${
          isUnread ? "bg-primary/5 border-primary/20" : "bg-background"
        }`}
      >
        <div
          className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
            isUnread ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium truncate">{n.title}</p>
            <Badge variant="outline" className="text-xs shrink-0">
              {NotificationTypeLabels[n.type] ?? "Bildirim"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.message}</p>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground">
              {formatRelative(n.createdDate)}
            </span>
            <div className="flex items-center gap-1">
              {n.actionUrl && (
                <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <Link to={n.actionUrl}>Aç</Link>
                </Button>
              )}
              {isUnread && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Okundu olarak işaretle"
                  onClick={() => markOne.mutate(n.id)}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                title="Sil"
                onClick={() => {
                  if (window.confirm("Bu bildirimi silmek istediğinize emin misiniz?")) {
                    deleteOne.mutate(n.id)
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasUnread = notifications?.some((n) => n.status === NotificationStatus.Unread) ?? false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bildirimler</h1>
          <p className="text-muted-foreground">Sistem bildirimleri ve uyarılarınız</p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Liste
              </CardTitle>
              <CardDescription>
                {notifications && notifications.length >= limit
                  ? `Son ${notifications.length} bildirim gösteriliyor`
                  : `Toplam ${notifications?.length ?? 0} bildirim`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFilters.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  {Object.entries(NotificationTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">Bildirim yok</p>
              <p className="text-xs text-muted-foreground mt-1">
                Filtrelerinizi değiştirin veya yeni bildirimler beklenecek
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(renderItem)}
              {notifications.length >= limit && limit < 200 && (
                <div className="pt-2 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLimit((l) => Math.min(l + PAGE_SIZE, 200))}
                  >
                    Daha Fazla Yükle
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
