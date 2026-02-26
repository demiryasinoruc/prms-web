import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateMaintenanceRecord,
  useUpdateMaintenanceRecord,
  useMaintenanceRecordForEdit,
} from "./hooks"
import {
  MaintenanceType,
  MaintenanceStatus,
  MaintenanceTypeLabels,
  MaintenanceStatusLabels,
  type MaintenanceRecord,
} from "./api"
import { useInventorySelect, useInventoryDetail } from "@/features/inventory/hooks"
import { useEmployeeSelect } from "@/features/employees/hooks"

const maintenanceRecordSchema = z.object({
  inventoryId: z.string().min(1, "Envanter seçimi zorunlu"),
  maintenanceScheduleId: z.string().nullable(),
  maintenanceType: z.nativeEnum(MaintenanceType),
  status: z.nativeEnum(MaintenanceStatus),
  title: z.string().min(1, "Başlık zorunlu"),
  description: z.string().optional(),
  scheduledDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
  lifespanAtMaintenance: z.number().nullable().optional(),
  performedByEmployeeId: z.string().nullable().optional(),
  performedByExternal: z.string().nullable().optional(),
  totalCost: z.number().nullable().optional(),
  laborCost: z.number().nullable().optional(),
  partsCost: z.number().nullable().optional(),
  nextScheduledDate: z.string().nullable().optional(),
  nextScheduledLifespan: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type MaintenanceRecordFormData = z.infer<typeof maintenanceRecordSchema>

interface MaintenanceRecordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: MaintenanceRecord | null
}

const defaultValues: MaintenanceRecordFormData = {
  inventoryId: "",
  maintenanceScheduleId: null,
  maintenanceType: MaintenanceType.Preventive,
  status: MaintenanceStatus.Scheduled,
  title: "",
  description: "",
  scheduledDate: null,
  startDate: null,
  completedDate: null,
  lifespanAtMaintenance: null,
  performedByEmployeeId: null,
  performedByExternal: null,
  totalCost: null,
  laborCost: null,
  partsCost: null,
  nextScheduledDate: null,
  nextScheduledLifespan: null,
  notes: null,
}

export function MaintenanceRecordDialog({
  open,
  onOpenChange,
  record,
}: MaintenanceRecordDialogProps) {
  const createRecord = useCreateMaintenanceRecord()
  const updateRecord = useUpdateMaintenanceRecord()

  const { data: editData, isLoading: isLoadingEdit, isFetching: isFetchingEdit } = useMaintenanceRecordForEdit(
    open && record ? record.id : null
  )

  const { data: inventoryItems, isLoading: isLoadingInventory } = useInventorySelect()
  const { data: employees, isLoading: isLoadingEmployees } = useEmployeeSelect()

  // Verinin doğru kayda ait olup olmadığını kontrol et
  const hasCorrectData = record
    ? editData?.id?.toLowerCase() === record.id.toLowerCase()
    : true

  const [performerType, setPerformerType] = useState<"employee" | "external">("employee")

  const formValues: MaintenanceRecordFormData = (open && record && editData && hasCorrectData)
    ? {
        inventoryId: editData.inventoryId?.toLowerCase() || "",
        maintenanceScheduleId: editData.maintenanceScheduleId?.toLowerCase() || null,
        maintenanceType: editData.maintenanceType,
        status: editData.status,
        title: editData.title,
        description: editData.description || "",
        scheduledDate: editData.scheduledDate ? editData.scheduledDate.split("T")[0] : null,
        startDate: editData.startDate ? editData.startDate.split("T")[0] : null,
        completedDate: editData.completedDate ? editData.completedDate.split("T")[0] : null,
        lifespanAtMaintenance: editData.lifespanAtMaintenance,
        performedByEmployeeId: editData.performedByEmployeeId?.toLowerCase() || null,
        performedByExternal: editData.performedByExternal,
        totalCost: editData.totalCost,
        laborCost: editData.laborCost,
        partsCost: editData.partsCost,
        nextScheduledDate: editData.nextScheduledDate ? editData.nextScheduledDate.split("T")[0] : null,
        nextScheduledLifespan: editData.nextScheduledLifespan,
        notes: editData.notes,
      }
    : defaultValues

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceRecordFormData>({
    resolver: zodResolver(maintenanceRecordSchema),
    values: open && hasCorrectData ? formValues : defaultValues,
  })

  const status = watch("status")
  const inventoryId = watch("inventoryId")

  // Seçili envanterin detayını getir (ömür takibi kontrolü için)
  const { data: selectedInventory } = useInventoryDetail(inventoryId || null)

  const hasLifespanTracking = selectedInventory?.lifespanUnitTypeName != null

  // Set performer type based on edit data
  // hasCorrectData kontrolü: Sadece doğru kayda ait veri geldiğinde performerType'ı güncelle
  useEffect(() => {
    if (open && editData && hasCorrectData) {
      if (editData.performedByEmployeeId) {
        setPerformerType("employee")
      } else if (editData.performedByExternal) {
        setPerformerType("external")
      } else {
        // Neither set, default to employee
        setPerformerType("employee")
      }
    } else if (!open) {
      setPerformerType("employee")
    }
  }, [open, editData, hasCorrectData])

  // Handle performer type change
  const handlePerformerTypeChange = (type: "employee" | "external") => {
    setPerformerType(type)
    if (type === "employee") {
      setValue("performedByExternal", null)
    } else {
      setValue("performedByEmployeeId", null)
    }
  }

  const onSubmit = async (data: MaintenanceRecordFormData) => {
    try {
      const requestData = {
        inventoryId: data.inventoryId,
        maintenanceScheduleId: data.maintenanceScheduleId,
        maintenanceType: data.maintenanceType,
        status: data.status,
        title: data.title,
        description: data.description || "",
        scheduledDate: data.scheduledDate || null,
        startDate: data.startDate || null,
        completedDate: data.completedDate || null,
        lifespanAtMaintenance: data.lifespanAtMaintenance ?? null,
        performedByEmployeeId: performerType === "employee" ? (data.performedByEmployeeId || null) : null,
        performedByExternal: performerType === "external" ? (data.performedByExternal || null) : null,
        totalCost: data.totalCost ?? null,
        laborCost: data.laborCost ?? null,
        partsCost: data.partsCost ?? null,
        nextScheduledDate: data.nextScheduledDate || null,
        nextScheduledLifespan: data.nextScheduledLifespan ?? null,
        notes: data.notes || null,
      }

      if (record) {
        await updateRecord.mutateAsync({
          id: record.id,
          data: requestData,
        })
      } else {
        await createRecord.mutateAsync(requestData)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createRecord.isPending || updateRecord.isPending

  // Edit modunda tüm veriler yüklenene kadar bekle
  // hasCorrectData: Verinin doğru kayda ait olup olmadığını kontrol eder (kayıt değiştiğinde eski veriyi göstermeyi önler)
  const isLoadingData = record
    ? (isLoadingEdit || isFetchingEdit || isLoadingInventory || isLoadingEmployees || !hasCorrectData)
    : (isLoadingInventory || isLoadingEmployees)

  if (isLoadingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yükleniyor</DialogTitle>
            <DialogDescription>Bakım kaydı bilgileri yükleniyor...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {record ? "Bakım Kaydı Düzenle" : "Yeni Bakım Kaydı"}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>
                    Bakım kaydı, envanter öğelerine yapılan bakım işlemlerini takip eder.
                    Periyodik bakımlar, arıza giderme, muayene ve kalibrasyon gibi işlemleri
                    kayıt altına alarak bakım geçmişini ve maliyetlerini izlemenizi sağlar.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
          <DialogDescription>
            Bakım kaydı bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Envanter *</Label>
              <Controller
                control={control}
                name="inventoryId"
                render={({ field }) => (
                  <Select
                    key={`inventory-${field.value}`}
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Envanter seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Envanter seçiniz</SelectItem>
                      {inventoryItems?.map((item) => (
                        <SelectItem key={item.id} value={item.id.toLowerCase()}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.inventoryId && (
                <p className="text-sm text-destructive">{errors.inventoryId.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Başlık *</Label>
              <Input
                placeholder="Bakım kaydı başlığı"
                {...register("title")}
                autoFocus
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Bakım Türü *</Label>
              <Controller
                control={control}
                name="maintenanceType"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bakım türü seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MaintenanceTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {record && (
              <div className="space-y-2">
                <Label>Durum *</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MaintenanceStatusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Planlanan Tarih</Label>
              <Input
                type="date"
                {...register("scheduledDate")}
              />
            </div>

            <div className="space-y-2">
              <Label>Başlangıç Tarihi</Label>
              <Input
                type="date"
                {...register("startDate")}
              />
            </div>

            <div className="space-y-2">
              <Label>Tamamlanma Tarihi</Label>
              <Input
                type="date"
                {...register("completedDate")}
              />
            </div>
          </div>

          {/* Performer */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bakımı Yapan</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={performerType === "employee" ? "default" : "outline"}
                  onClick={() => handlePerformerTypeChange("employee")}
                  className="flex-1"
                  size="sm"
                >
                  Personel
                </Button>
                <Button
                  type="button"
                  variant={performerType === "external" ? "default" : "outline"}
                  onClick={() => handlePerformerTypeChange("external")}
                  className="flex-1"
                  size="sm"
                >
                  Dış Kaynak
                </Button>
              </div>
            </div>

            {performerType === "employee" ? (
              <div className="space-y-2">
                <Label>Personel</Label>
                <Controller
                  control={control}
                  name="performedByEmployeeId"
                  render={({ field }) => (
                    <Select
                      key={`employee-${field.value}`}
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Personel seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Personel seçiniz</SelectItem>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toLowerCase()}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Dış Kaynak Adı</Label>
                <Input
                  placeholder="Firma/kişi adı"
                  {...register("performedByExternal")}
                />
              </div>
            )}
          </div>

          {/* Costs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>İşçilik Maliyeti</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("laborCost", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Parça Maliyeti</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("partsCost", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Toplam Maliyet</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("totalCost", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Lifespan - Sadece ömür takibi olan ürünler için */}
          {hasLifespanTracking && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bakım Anındaki Ömür ({selectedInventory?.lifespanUnitTypeName})</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Örn: 500"
                  {...register("lifespanAtMaintenance", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Bakım yapıldığında ürünün kullanım değeri
                </p>
              </div>
            </div>
          )}

          {/* Next Schedule */}
          {status === MaintenanceStatus.Completed && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sonraki Bakım Tarihi</Label>
                <Input
                  type="date"
                  {...register("nextScheduledDate")}
                />
              </div>

              {hasLifespanTracking && (
                <div className="space-y-2">
                  <Label>Sonraki Bakım Ömrü ({selectedInventory?.lifespanUnitTypeName})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Örn: 1000"
                    {...register("nextScheduledLifespan", { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Description & Notes */}
          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea
              placeholder="Bakım detayları"
              {...register("description")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Textarea
              placeholder="Ek notlar"
              {...register("notes")}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {record ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
