import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Calendar,
  Pencil,
  Trash2,
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
import { DataTable } from "@/components/data-table"
import { useCalendarEvents, useDeleteCalendarEvent } from "./hooks"
import { EventDialog } from "./event-dialog"
import {
  CalendarEventType,
  CalendarEventTypeLabels,
  type CalendarEvent,
} from "./api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

export default function CalendarPage() {
  const canManage = usePermission(Permissions.Calendar.Manage)
  const [typeFilter, setTypeFilter] = useState<CalendarEventType | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const { data: events, isLoading } = useCalendarEvents({
    type: typeFilter || undefined,
  })
  const deleteEvent = useDeleteCalendarEvent()

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingEvent(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getTypeVariant = (type: CalendarEventType) => {
    switch (type) {
      case CalendarEventType.Maintenance:
        return "secondary"
      case CalendarEventType.Holiday:
        return "default"
      case CalendarEventType.Blockout:
        return "destructive"
      case CalendarEventType.Reservation:
        return "outline"
      case CalendarEventType.Custom:
        return "secondary"
      default:
        return "default"
    }
  }

  const columns: ColumnDef<CalendarEvent>[] = [
    {
      accessorKey: "title",
      header: "Başlık",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: row.original.color || "#3b82f6" }}
          />
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Tür",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={getTypeVariant(row.original.type)}>
          {CalendarEventTypeLabels[row.original.type]}
        </Badge>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Başlangıç",
      enableSorting: false,
      cell: ({ row }) => formatDate(row.original.startDate),
    },
    {
      accessorKey: "endDate",
      header: "Bitiş",
      enableSorting: false,
      cell: ({ row }) => formatDate(row.original.endDate),
    },
    {
      accessorKey: "isAllDay",
      header: "Tüm Gün",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={row.original.isAllDay ? "default" : "outline"}>
          {row.original.isAllDay ? "Evet" : "Hayır"}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Durum",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Aktif" : "Pasif"}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {canManage && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Düzenle"
                onClick={() => handleEdit(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                title="Sil"
                onClick={() => deleteEvent.mutateAsync(row.original.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Takvim</h1>
          <p className="text-muted-foreground">
            Etkinlikleri ve planlamaları yönetin
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Etkinlik
          </Button>
        )}
      </div>

      {/* Tür Filtreleri */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={typeFilter === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setTypeFilter(null)}
        >
          Tümü
        </Badge>
        {Object.entries(CalendarEventTypeLabels).map(([key, label]) => (
          <Badge
            key={key}
            variant={typeFilter === Number(key) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTypeFilter(Number(key) as CalendarEventType)}
          >
            {label}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Etkinlik Listesi</CardTitle>
              <CardDescription>
                Toplam {events?.length || 0} etkinlik
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={events || []}
            isLoading={isLoading}
            emptyMessage="Henüz etkinlik eklenmemiş"
          />
        </CardContent>
      </Card>

      <EventDialog
        key={editingEvent?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        event={editingEvent}
      />

    </div>
  )
}
