import { useMemo, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin from "@fullcalendar/interaction"
import trLocale from "@fullcalendar/core/locales/tr"
import type {
  EventClickArg,
  EventInput,
  DateSelectArg,
} from "@fullcalendar/core"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useCalendarEvents } from "./hooks"
import { EventDialog } from "./event-dialog"
import {
  CalendarEventType,
  CalendarEventTypeLabels,
  type CalendarEvent,
} from "./api"
import { RentalDetailSheet } from "@/features/rentals/rental-detail-sheet"
import { useEmployeeSelect } from "@/features/employees/hooks"
import { useProductSelect } from "@/features/products/hooks"
import { useInventorySelect } from "@/features/inventory/hooks"
import { useWarehouseSelect } from "@/features/warehouses/hooks"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"

const NONE = "__none__"

export default function CalendarPage() {
  const canManage = usePermission(Permissions.Calendar.Manage)
  const calendarRef = useRef<FullCalendar>(null)

  // Filter state
  const [typeFilter, setTypeFilter] = useState<CalendarEventType | null>(null)
  const [employeeFilter, setEmployeeFilter] = useState<string | null>(null)
  const [productFilter, setProductFilter] = useState<string | null>(null)
  const [inventoryFilter, setInventoryFilter] = useState<string | null>(null)
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const dialogKey = useDialogResetKey(dialogOpen)
  // Rental detail sheet — calendar'daki "Kiralama" satırına tıklayınca açılır
  const [rentalDetailId, setRentalDetailId] = useState<string | null>(null)

  // Data
  const { data: events = [] } = useCalendarEvents({
    type: typeFilter || undefined,
    employeeId: employeeFilter || undefined,
    productId: productFilter || undefined,
    inventoryId: inventoryFilter || undefined,
    warehouseId: warehouseFilter || undefined,
  })

  // Selects for filter dropdowns
  const { data: employees = [] } = useEmployeeSelect()
  const { data: products = [] } = useProductSelect()
  const { data: inventories = [] } = useInventorySelect()
  const { data: warehouses = [] } = useWarehouseSelect()

  // FullCalendar event shape — uses startDate/endDate from API, color from event.
  const fcEvents: EventInput[] = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.startDate,
        end: e.endDate,
        allDay: e.isAllDay,
        backgroundColor: e.color || undefined,
        borderColor: e.color || undefined,
        extendedProps: { source: e },
      })),
    [events],
  )

  const handleEventClick = (info: EventClickArg) => {
    const source = info.event.extendedProps.source as CalendarEvent | undefined
    if (!source) return
    if (source.kind === "Rental") {
      setRentalDetailId(source.id)
    } else {
      setEditingEvent(source)
      setDialogOpen(true)
    }
  }

  const handleDateSelect = (sel: DateSelectArg) => {
    if (!canManage) return
    // Yeni etkinlik: tıklanan tarih aralığını dialog'a önceden geçir — şimdilik
    // EventDialog default state ile açılıyor; ileride preselected start/end propsları eklenebilir.
    setEditingEvent(null)
    setDialogOpen(true)
    // Seçimi temizle
    calendarRef.current?.getApi().unselect()
    void sel
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingEvent(null)
  }

  const clearFilters = () => {
    setTypeFilter(null)
    setEmployeeFilter(null)
    setProductFilter(null)
    setInventoryFilter(null)
    setWarehouseFilter(null)
  }

  const activeFilterCount = [
    typeFilter,
    employeeFilter,
    productFilter,
    inventoryFilter,
    warehouseFilter,
  ].filter((v) => v !== null).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Takvim</h1>
          <p className="text-muted-foreground">
            Etkinlikler, planlamalar ve rezervasyonlar
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Etkinlik
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterField label="Tür">
            <Select
              value={typeFilter === null ? NONE : String(typeFilter)}
              onValueChange={(v) =>
                setTypeFilter(v === NONE ? null : (Number(v) as CalendarEventType))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Tüm Türler</SelectItem>
                {Object.entries(CalendarEventTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Çalışan">
            <SelectFilter
              value={employeeFilter}
              onChange={setEmployeeFilter}
              options={employees.map((e) => ({ id: e.id, name: e.name }))}
              placeholder="Tüm çalışanlar"
            />
          </FilterField>

          <FilterField label="Araç / Envanter">
            <SelectFilter
              value={inventoryFilter}
              onChange={setInventoryFilter}
              options={inventories.map((i) => ({ id: i.id, name: i.name }))}
              placeholder="Tüm envanter"
            />
          </FilterField>

          <FilterField label="Ürün">
            <SelectFilter
              value={productFilter}
              onChange={setProductFilter}
              options={products.map((p) => ({ id: p.id, name: p.name }))}
              placeholder="Tüm ürünler"
            />
          </FilterField>

          <FilterField label="Depo">
            <SelectFilter
              value={warehouseFilter}
              onChange={setWarehouseFilter}
              options={warehouses.map((w) => ({ id: w.id, name: w.name }))}
              placeholder="Tüm depolar"
            />
          </FilterField>
        </div>
        {activeFilterCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{activeFilterCount} filtre aktif</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={clearFilters}
            >
              Temizle
            </Button>
          </div>
        )}
      </Card>

      {/* Calendar */}
      <Card className="p-3">
        <div className="fc-prms">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={trLocale}
            firstDay={1}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            buttonText={{
              today: "Bugün",
              month: "Ay",
              week: "Hafta",
              day: "Gün",
              list: "Liste",
            }}
            allDaySlot
            allDayText="Tüm Gün"
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            nowIndicator
            navLinks
            selectable={canManage}
            select={handleDateSelect}
            events={fcEvents}
            eventClick={handleEventClick}
            height="auto"
            contentHeight={650}
            eventDisplay="block"
            displayEventEnd
          />
        </div>
      </Card>

      <EventDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        event={editingEvent}
      />

      <RentalDetailSheet
        open={!!rentalDetailId}
        onOpenChange={(open) => !open && setRentalDetailId(null)}
        rentalId={rentalDetailId}
      />
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

interface SelectOption {
  id: string
  name: string
}

function SelectFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string | null
  onChange: (v: string | null) => void
  options: SelectOption[]
  placeholder: string
}) {
  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? null : v)}
    >
      <SelectTrigger className="h-9">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
