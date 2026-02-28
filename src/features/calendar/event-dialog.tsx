import { useForm, Controller } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  useCalendarEventDetail,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
} from "./hooks"
import {
  CalendarEventType,
  CalendarEventTypeLabels,
  type CalendarEvent,
} from "./api"

const eventSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  description: z.string(),
  type: z.number().min(1, "Tür seçiniz"),
  startDate: z.string().min(1, "Başlangıç tarihi zorunludur"),
  endDate: z.string().min(1, "Bitiş tarihi zorunludur"),
  isAllDay: z.boolean(),
  color: z.string(),
  isActive: z.boolean(),
})

type EventFormData = {
  title: string
  description: string
  type: number
  startDate: string
  endDate: string
  isAllDay: boolean
  color: string
  isActive: boolean
}

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent | null
}

const colorOptions = [
  { value: "#3b82f6", label: "Mavi" },
  { value: "#ef4444", label: "Kırmızı" },
  { value: "#22c55e", label: "Yeşil" },
  { value: "#f59e0b", label: "Turuncu" },
  { value: "#8b5cf6", label: "Mor" },
  { value: "#6b7280", label: "Gri" },
]

const defaultValues: EventFormData = {
  title: "",
  description: "",
  type: CalendarEventType.Custom,
  startDate: "",
  endDate: "",
  isAllDay: false,
  color: "#3b82f6",
  isActive: true,
}

export function EventDialog({ open, onOpenChange, event }: EventDialogProps) {
  const { data: eventDetail, isLoading: isLoadingDetail } = useCalendarEventDetail(event?.id || null)
  const createEvent = useCreateCalendarEvent()
  const updateEvent = useUpdateCalendarEvent()

  const formValues: EventFormData = (open && eventDetail) ? {
    title: eventDetail.title,
    description: eventDetail.description || "",
    type: eventDetail.type,
    startDate: eventDetail.startDate.split("T")[0],
    endDate: eventDetail.endDate.split("T")[0],
    isAllDay: eventDetail.isAllDay,
    color: eventDetail.color || "#3b82f6",
    isActive: eventDetail.isActive,
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: formResolver<EventFormData>(eventSchema),
    values: open ? formValues : defaultValues,
  })

  const onSubmit = async (data: EventFormData) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        isAllDay: data.isAllDay,
        productId: null,
        inventoryId: null,
        warehouseId: null,
        employeeId: null,
        color: data.color,
        isActive: data.isActive,
      }

      if (event) {
        await updateEvent.mutateAsync({ id: event.id, data: payload })
      } else {
        await createEvent.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createEvent.isPending || updateEvent.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {event ? "Etkinlik Düzenle" : "Yeni Etkinlik"}
          </DialogTitle>
          <DialogDescription>Etkinlik bilgilerini girin</DialogDescription>
        </DialogHeader>

        {event && isLoadingDetail ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Başlık *</Label>
              <Input placeholder="Etkinlik başlığı" {...register("title")} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                placeholder="Etkinlik açıklaması..."
                {...register("description")}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tür *</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      key={`type-${field.value}`}
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tür seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CalendarEventTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Renk</Label>
                <Controller
                  control={control}
                  name="color"
                  render={({ field }) => (
                    <Select key={`color-${field.value}`} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Renk seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: option.value }}
                              />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlangıç Tarihi *</Label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Bitiş Tarihi *</Label>
                <Input type="date" {...register("endDate")} />
                {errors.endDate && (
                  <p className="text-sm text-destructive">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Tüm Gün</Label>
                <p className="text-sm text-muted-foreground">
                  Etkinlik tüm gün sürecek
                </p>
              </div>
              <Controller
                control={control}
                name="isAllDay"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {event && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Durum</Label>
                  <p className="text-sm text-muted-foreground">
                    Etkinliğin aktif/pasif durumu
                  </p>
                </div>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm ${field.value ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        {field.value ? "Aktif" : "Pasif"}
                      </span>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
              </div>
            )}

            <Separator />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {event ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
