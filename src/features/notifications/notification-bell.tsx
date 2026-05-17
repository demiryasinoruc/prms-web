import { useState } from "react"
import { Bell, Check, Trash2 } from "lucide-react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "./hooks"
import {
  NotificationStatus,
  NotificationTypeLabels,
  type NotificationListItem,
} from "./api"

const MAX_VISIBLE = 8

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "az önce"
  if (diffMin < 60) return `${diffMin} dk önce`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} sa önce`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} gün önce`
  return new Date(isoDate).toLocaleDateString("tr-TR")
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const { data: count } = useUnreadCount()
  const { data: notifications, isLoading } = useNotifications({})
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()

  const unreadCount = count?.unreadCount ?? 0
  const visible = (notifications ?? []).slice(0, MAX_VISIBLE)

  const handleClick = (notification: NotificationListItem) => {
    if (notification.status === NotificationStatus.Unread) {
      markRead.mutate(notification.id)
    }
    if (notification.actionUrl) {
      setOpen(false)
      navigate(notification.actionUrl)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Bildirimler">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-3">
          <div className="text-sm font-semibold">Bildirimler</div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              Tümünü okundu işaretle
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-96">
          {isLoading && (
            <div className="space-y-2 p-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {!isLoading && visible.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Bildirim bulunmuyor
            </div>
          )}
          {!isLoading &&
            visible.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleClick(notification)}
                className={cn(
                  "group flex w-full items-start gap-2 border-b px-3 py-2 text-left transition-colors hover:bg-muted/50",
                  notification.status === NotificationStatus.Unread && "bg-muted/30"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{notification.title}</span>
                    {notification.status === NotificationStatus.Unread && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="Okunmadı" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="px-1 py-0 text-[10px]">
                      {NotificationTypeLabels[notification.type] ?? "Bildirim"}
                    </Badge>
                    <span>{formatRelativeTime(notification.createdDate)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation()
                    deleteNotification.mutate(notification.id)
                  }}
                  aria-label="Sil"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </button>
            ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
